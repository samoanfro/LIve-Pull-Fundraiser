-- Phase 8: Audit History and Exception Handling
--
-- audit_logs is append-only through normal application permissions: no
-- INSERT/UPDATE/DELETE policy exists for any authenticated role, so the
-- only way a row gets written is through record_audit_log(), a SECURITY
-- DEFINER function that runs with the table owner's privileges (which
-- bypasses RLS, same mechanism every other SECURITY DEFINER function here
-- relies on). Never grant direct table access to audit_logs from the client.

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_user_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  previous_value jsonb,
  new_value jsonb,
  reason text,
  created_at timestamptz not null default now(),
  request_metadata jsonb
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);

alter table public.audit_logs enable row level security;

create policy audit_logs_select_admins
  on public.audit_logs for select
  to authenticated
  using (public.is_org_admin(organization_id));

-- Deliberately no insert/update/delete policy of any kind: default-deny for
-- every authenticated role, including admin. Only record_audit_log() (below)
-- can write, and nothing can update or delete a row through the API.

create function public.record_audit_log(
  target_org_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_previous_value jsonb default null,
  p_new_value jsonb default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id,
    previous_value, new_value, reason
  )
  values (
    target_org_id, auth.uid(), p_action, p_entity_type, p_entity_id,
    p_previous_value, p_new_value, p_reason
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Re-instrument existing Phase 4-7 functions with audit logging.
-- CREATE OR REPLACE, not edits to the original migrations, per CLAUDE.md.
-- ---------------------------------------------------------------------------

create or replace function public.finalize_paid_order(target_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status public.order_status;
  v_org_id uuid;
begin
  select status, organization_id into current_status, v_org_id
  from public.orders where id = target_order_id for update;

  if current_status is null then
    raise exception 'Order % not found', target_order_id;
  end if;

  if current_status <> 'PENDING_PAYMENT' then
    return;
  end if;

  update public.inventory_units iu
  set status = 'SOLD'
  from public.inventory_reservations ir
  where ir.order_id = target_order_id
    and ir.status = 'active'
    and ir.inventory_unit_id = iu.id;

  insert into public.order_inventory_assignments (order_item_id, inventory_unit_id)
  select ir.order_item_id, ir.inventory_unit_id
  from public.inventory_reservations ir
  where ir.order_id = target_order_id
    and ir.status = 'active'
  on conflict (inventory_unit_id) do nothing;

  perform public.record_audit_log(
    v_org_id, 'pack_assigned', 'order', target_order_id,
    null, jsonb_build_object('order_status', 'PACK_ASSIGNED'),
    'Payment confirmed; reservations converted to assignments'
  );

  update public.inventory_units iu
  set status = 'ASSIGNED'
  from public.order_inventory_assignments oia
  join public.order_items oi on oi.id = oia.order_item_id
  where oi.order_id = target_order_id
    and oia.inventory_unit_id = iu.id
    and iu.status = 'SOLD';

  update public.inventory_reservations
  set status = 'converted'
  where order_id = target_order_id
    and status = 'active';

  update public.orders
  set status = 'PACK_ASSIGNED', updated_at = now()
  where id = target_order_id;
end;
$$;

create or replace function public.confirm_opening_queue_pack(
  target_queue_id uuid,
  entered_pack_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_expected_pack_id text;
  v_unit_id uuid;
  v_order_id uuid;
  v_order_item_id uuid;
  v_session_id uuid;
  v_customer_id uuid;
begin
  select os.organization_id, oq.inventory_unit_id, oq.order_id, oq.order_item_id, oq.opening_session_id
  into v_org_id, v_unit_id, v_order_id, v_order_item_id, v_session_id
  from public.opening_queue oq
  join public.opening_sessions os on os.id = oq.opening_session_id
  where oq.id = target_queue_id;

  if v_unit_id is null then
    raise exception 'Queue entry not found';
  end if;

  if not public.can_manage_openings(v_org_id) then
    raise exception 'Not authorized to run openings';
  end if;

  select pack_id into v_expected_pack_id
  from public.inventory_units
  where id = v_unit_id;

  if entered_pack_id <> v_expected_pack_id then
    update public.opening_queue
    set queue_status = 'exception'
    where id = target_queue_id;

    perform public.record_audit_log(
      v_org_id, 'pack_mismatch_exception', 'opening_queue', target_queue_id,
      jsonb_build_object('expected_pack_id', v_expected_pack_id),
      jsonb_build_object('entered_pack_id', entered_pack_id),
      'Host-entered Pack ID did not match the expected physical pack'
    );

    return false;
  end if;

  select customer_id into v_customer_id from public.orders where id = v_order_id;

  update public.opening_queue
  set queue_status = 'in_progress', started_at = now()
  where id = target_queue_id;

  insert into public.opened_packs (
    inventory_unit_id, order_id, order_item_id, customer_id, opening_session_id,
    confirmed_pack_id_entered, confirmed_by, opened_by
  )
  values (
    v_unit_id, v_order_id, v_order_item_id, v_customer_id, v_session_id,
    entered_pack_id, auth.uid(), auth.uid()
  );

  update public.inventory_units set status = 'OPENING' where id = v_unit_id;
  update public.orders set status = 'OPENING_IN_PROGRESS', updated_at = now() where id = v_order_id;

  perform public.record_audit_log(
    v_org_id, 'opening_confirmed', 'inventory_unit', v_unit_id,
    null, jsonb_build_object('confirmed_pack_id_entered', entered_pack_id),
    'Pack ID confirmed; opening started'
  );

  return true;
end;
$$;

create or replace function public.complete_opening(target_opened_pack_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_status text;
  v_unit_id uuid;
  v_order_id uuid;
  v_order_item_id uuid;
  v_session_id uuid;
  v_total_items integer;
  v_opened_items integer;
begin
  select os.organization_id, op.status, op.inventory_unit_id, op.order_id, op.order_item_id, op.opening_session_id
  into v_org_id, v_status, v_unit_id, v_order_id, v_order_item_id, v_session_id
  from public.opened_packs op
  join public.opening_sessions os on os.id = op.opening_session_id
  where op.id = target_opened_pack_id;

  if v_unit_id is null then
    raise exception 'Opened pack not found';
  end if;

  if not public.can_manage_openings(v_org_id) then
    raise exception 'Not authorized to run openings';
  end if;

  if v_status = 'locked' then
    return;
  end if;

  update public.opened_packs set status = 'locked' where id = target_opened_pack_id;
  update public.inventory_units set status = 'OPENED' where id = v_unit_id;

  update public.opening_queue
  set queue_status = 'completed', completed_at = now()
  where opening_session_id = v_session_id
    and order_item_id = v_order_item_id;

  perform public.record_audit_log(
    v_org_id, 'opening_completed', 'opened_pack', target_opened_pack_id,
    jsonb_build_object('status', 'confirmed'), jsonb_build_object('status', 'locked'),
    null
  );

  select count(*) into v_total_items from public.order_items where order_id = v_order_id;
  select count(*) into v_opened_items
  from public.opened_packs
  where order_id = v_order_id and status = 'locked';

  if v_opened_items >= v_total_items then
    update public.orders
    set status = 'AWAITING_CUSTOMER_DECISION', updated_at = now()
    where id = v_order_id;
  end if;
end;
$$;

create or replace function public.add_pulled_item(
  target_opened_pack_id uuid,
  item_title text,
  item_category text default null,
  item_description text default null,
  item_quantity integer default 1,
  item_image_url text default null,
  item_external_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_status text;
  v_unit_id uuid;
  v_order_id uuid;
  v_customer_id uuid;
  v_pulled_item_id uuid;
begin
  select os.organization_id, op.status, op.inventory_unit_id, op.order_id, op.customer_id
  into v_org_id, v_status, v_unit_id, v_order_id, v_customer_id
  from public.opened_packs op
  join public.opening_sessions os on os.id = op.opening_session_id
  where op.id = target_opened_pack_id;

  if v_unit_id is null then
    raise exception 'Opened pack not found';
  end if;

  if not public.can_manage_openings(v_org_id) then
    raise exception 'Not authorized to run openings';
  end if;

  if v_status = 'locked' then
    raise exception 'This opening is completed and locked. Corrections require an authorized audited action.';
  end if;

  insert into public.pulled_items (
    opened_pack_id, inventory_unit_id, order_id, customer_id,
    title, category, description, quantity, image_url, external_reference, created_by
  )
  values (
    target_opened_pack_id, v_unit_id, v_order_id, v_customer_id,
    item_title, item_category, item_description, coalesce(item_quantity, 1),
    item_image_url, item_external_reference, auth.uid()
  )
  returning id into v_pulled_item_id;

  perform public.record_audit_log(
    v_org_id, 'pull_created', 'pulled_item', v_pulled_item_id,
    null, jsonb_build_object('title', item_title, 'category', item_category, 'quantity', item_quantity),
    null
  );

  return v_pulled_item_id;
end;
$$;

create or replace function public.confirm_donation_back(
  target_order_id uuid,
  policy_version text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_org_id uuid;
  v_donation_back_id uuid;
  v_already_existed boolean;
begin
  select customer_id, organization_id into v_customer_id, v_org_id
  from public.orders where id = target_order_id;

  if v_customer_id is null then
    raise exception 'Order not found';
  end if;

  select exists(select 1 from public.donation_backs where order_id = target_order_id) into v_already_existed;

  insert into public.donation_backs (order_id, customer_id, policy_version_accepted)
  values (target_order_id, v_customer_id, policy_version)
  on conflict (order_id) do update set order_id = excluded.order_id
  returning id into v_donation_back_id;

  insert into public.donation_back_items (donation_back_id, pulled_item_id)
  select v_donation_back_id, pi.id
  from public.pulled_items pi
  where pi.order_id = target_order_id
  on conflict (pulled_item_id) do nothing;

  update public.orders
  set status = 'DONATE_BACK_SELECTED', updated_at = now()
  where id = target_order_id;

  if not v_already_existed then
    perform public.record_audit_log(
      v_org_id, 'donation_back_confirmed', 'donation_back', v_donation_back_id,
      null, jsonb_build_object('policy_version_accepted', policy_version),
      'Supporter confirmed donate-back'
    );
  end if;

  return v_donation_back_id;
end;
$$;

create or replace function public.submit_shipping_address(
  target_order_id uuid,
  address jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_org_id uuid;
  v_request_id uuid;
  v_previous_address jsonb;
begin
  select customer_id, organization_id into v_customer_id, v_org_id
  from public.orders where id = target_order_id;

  if v_customer_id is null then
    raise exception 'Order not found';
  end if;

  select address_json into v_previous_address
  from public.shipping_requests where order_id = target_order_id;

  insert into public.shipping_requests (order_id, customer_id, status, address_json)
  values (target_order_id, v_customer_id, 'ADDRESS_CONFIRMED', address)
  on conflict (order_id) do update
    set address_json = excluded.address_json,
        status = case
          when public.shipping_requests.status = 'REQUESTED' then 'ADDRESS_CONFIRMED'
          else public.shipping_requests.status
        end
  returning id into v_request_id;

  update public.orders
  set status = 'SHIP_REQUESTED', updated_at = now()
  where id = target_order_id;

  perform public.record_audit_log(
    v_org_id,
    case when v_previous_address is null then 'shipping_address_submitted' else 'shipping_address_corrected' end,
    'shipping_request', v_request_id,
    v_previous_address, address, null
  );

  return v_request_id;
end;
$$;

create or replace function public.update_shipping_fulfillment(
  target_shipping_request_id uuid,
  new_status text,
  new_carrier text default null,
  new_service text default null,
  new_tracking_number text default null,
  new_label_reference text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_order_id uuid;
  v_previous record;
begin
  select o.organization_id, sr.order_id into v_org_id, v_order_id
  from public.shipping_requests sr
  join public.orders o on o.id = sr.order_id
  where sr.id = target_shipping_request_id;

  if v_org_id is null then
    raise exception 'Shipping request not found';
  end if;

  if not public.can_manage_shipping(v_org_id) then
    raise exception 'Not authorized to manage shipping';
  end if;

  if new_status not in ('REQUESTED', 'ADDRESS_CONFIRMED', 'LABEL_CREATED', 'PACKED', 'SHIPPED', 'DELIVERED', 'EXCEPTION') then
    raise exception 'Invalid shipping status: %', new_status;
  end if;

  select status, carrier, tracking_number into v_previous
  from public.shipping_requests where id = target_shipping_request_id;

  update public.shipping_requests
  set
    status = new_status,
    carrier = coalesce(new_carrier, carrier),
    service = coalesce(new_service, service),
    tracking_number = coalesce(new_tracking_number, tracking_number),
    label_reference = coalesce(new_label_reference, label_reference),
    shipped_at = case when new_status = 'SHIPPED' and shipped_at is null then now() else shipped_at end,
    delivered_at = case when new_status = 'DELIVERED' and delivered_at is null then now() else delivered_at end
  where id = target_shipping_request_id;

  perform public.record_audit_log(
    v_org_id, 'shipping_fulfillment_updated', 'shipping_request', target_shipping_request_id,
    to_jsonb(v_previous),
    jsonb_build_object('status', new_status, 'carrier', new_carrier, 'tracking_number', new_tracking_number),
    null
  );

  if new_status = 'SHIPPED' then
    update public.orders set status = 'SHIPPED', updated_at = now() where id = v_order_id;
  elsif new_status = 'DELIVERED' then
    update public.orders set status = 'COMPLETED', updated_at = now() where id = v_order_id;
  end if;
end;
$$;

create or replace function public.set_donation_disposition(
  target_donation_back_id uuid,
  new_disposition text,
  note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_order_id uuid;
  v_previous_disposition text;
begin
  select o.organization_id, db.order_id, db.disposition_status
  into v_org_id, v_order_id, v_previous_disposition
  from public.donation_backs db
  join public.orders o on o.id = db.order_id
  where db.id = target_donation_back_id;

  if v_org_id is null then
    raise exception 'Donation back record not found';
  end if;

  if not public.is_org_admin(v_org_id) then
    raise exception 'Not authorized to record donation disposition';
  end if;

  if new_disposition not in (
    'RECEIVED_RETAINED', 'STORED', 'REUSED_IN_FUNDRAISER',
    'SOLD_SEPARATELY_WHERE_ALLOWED', 'DONATED_EXTERNALLY', 'DISPOSED', 'OTHER_WITH_NOTE'
  ) then
    raise exception 'Invalid disposition: %', new_disposition;
  end if;

  update public.donation_backs
  set disposition_status = new_disposition, disposition_note = note
  where id = target_donation_back_id;

  perform public.record_audit_log(
    v_org_id, 'donation_disposition_set', 'donation_back', target_donation_back_id,
    jsonb_build_object('disposition_status', v_previous_disposition),
    jsonb_build_object('disposition_status', new_disposition, 'note', note),
    null
  );

  update public.orders set status = 'COMPLETED', updated_at = now() where id = v_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- New exception-handling functions.
-- ---------------------------------------------------------------------------

-- Authorized correction to a pulled item. Unlike add_pulled_item, this is
-- allowed even after the opening is locked -- that is precisely what makes
-- it an "authorized audited action" rather than casual editing. Preserves
-- the original values in the audit row.
create function public.correct_pulled_item(
  target_pulled_item_id uuid,
  new_title text default null,
  new_category text default null,
  new_description text default null,
  new_quantity integer default null,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_previous record;
begin
  select os.organization_id into v_org_id
  from public.pulled_items pi
  join public.opened_packs op on op.id = pi.opened_pack_id
  join public.opening_sessions os on os.id = op.opening_session_id
  where pi.id = target_pulled_item_id;

  if v_org_id is null then
    raise exception 'Pulled item not found';
  end if;

  if not public.is_org_admin(v_org_id) then
    raise exception 'Not authorized to correct pulled items';
  end if;

  if reason is null or length(trim(reason)) = 0 then
    raise exception 'A reason is required to correct a pulled item';
  end if;

  select title, category, description, quantity into v_previous
  from public.pulled_items where id = target_pulled_item_id;

  update public.pulled_items
  set
    title = coalesce(new_title, title),
    category = coalesce(new_category, category),
    description = coalesce(new_description, description),
    quantity = coalesce(new_quantity, quantity)
  where id = target_pulled_item_id;

  perform public.record_audit_log(
    v_org_id, 'pull_corrected', 'pulled_item', target_pulled_item_id,
    to_jsonb(v_previous),
    jsonb_build_object(
      'title', coalesce(new_title, v_previous.title),
      'category', coalesce(new_category, v_previous.category),
      'description', coalesce(new_description, v_previous.description),
      'quantity', coalesce(new_quantity, v_previous.quantity)
    ),
    reason
  );
end;
$$;

-- Authorized inventory status override (DAMAGED, MISSING, VOIDED, or back to
-- AVAILABLE for a correction). Always audited with a required reason.
create function public.set_inventory_status(
  target_inventory_unit_id uuid,
  new_status text,
  reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_previous_status public.inventory_unit_status;
begin
  select organization_id, status into v_org_id, v_previous_status
  from public.inventory_units where id = target_inventory_unit_id;

  if v_org_id is null then
    raise exception 'Inventory unit not found';
  end if;

  if not public.is_org_admin(v_org_id) then
    raise exception 'Not authorized to change inventory status';
  end if;

  if reason is null or length(trim(reason)) = 0 then
    raise exception 'A reason is required to change inventory status';
  end if;

  if new_status not in ('AVAILABLE', 'DAMAGED', 'MISSING', 'VOIDED') then
    raise exception 'This function only permits AVAILABLE, DAMAGED, MISSING, or VOIDED corrections';
  end if;

  update public.inventory_units
  set status = new_status::public.inventory_unit_status
  where id = target_inventory_unit_id;

  perform public.record_audit_log(
    v_org_id, 'inventory_status_adjusted', 'inventory_unit', target_inventory_unit_id,
    jsonb_build_object('status', v_previous_status),
    jsonb_build_object('status', new_status),
    reason
  );
end;
$$;

-- Staff role changes, audited.
create function public.set_member_role(
  target_member_id uuid,
  new_role text,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_previous_role public.org_role;
begin
  select organization_id, role into v_org_id, v_previous_role
  from public.organization_members where id = target_member_id;

  if v_org_id is null then
    raise exception 'Member not found';
  end if;

  if not public.is_org_admin(v_org_id) then
    raise exception 'Not authorized to change staff roles';
  end if;

  update public.organization_members
  set role = new_role::public.org_role
  where id = target_member_id;

  perform public.record_audit_log(
    v_org_id, 'staff_role_changed', 'organization_member', target_member_id,
    jsonb_build_object('role', v_previous_role),
    jsonb_build_object('role', new_role),
    reason
  );
end;
$$;

-- Manual refund recording. Stripe's Refund API is not called here (no
-- production Stripe integration to call it against yet) -- this records a
-- refund a staff member has already issued via the Stripe dashboard, for
-- audit and reporting purposes. Never touches opened_packs, pulled_items,
-- or order_inventory_assignments: a refund after opening does not erase
-- custody history.
create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  stripe_refund_id text,
  amount_cents integer not null check (amount_cents >= 0),
  reason text,
  created_at timestamptz not null default now(),
  constraint refunds_stripe_refund_id_unique unique (stripe_refund_id)
);

create index refunds_order_idx on public.refunds (order_id);

alter table public.refunds enable row level security;

create policy refunds_select_org_staff
  on public.refunds for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = public.refunds.order_id
        and public.is_org_member(o.organization_id)
    )
  );

create function public.record_refund(
  target_order_id uuid,
  stripe_refund_id text,
  amount_cents integer,
  final_status text,
  reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_refund_id uuid;
  v_previous_status public.order_status;
begin
  select organization_id, status into v_org_id, v_previous_status
  from public.orders where id = target_order_id;

  if v_org_id is null then
    raise exception 'Order not found';
  end if;

  if not public.is_org_admin(v_org_id) then
    raise exception 'Not authorized to record refunds';
  end if;

  if final_status not in ('REFUND_PENDING', 'REFUNDED') then
    raise exception 'final_status must be REFUND_PENDING or REFUNDED';
  end if;

  insert into public.refunds (order_id, stripe_refund_id, amount_cents, reason)
  values (target_order_id, stripe_refund_id, amount_cents, reason)
  returning id into v_refund_id;

  update public.orders
  set status = final_status::public.order_status, updated_at = now()
  where id = target_order_id;

  perform public.record_audit_log(
    v_org_id, 'refund_recorded', 'order', target_order_id,
    jsonb_build_object('status', v_previous_status),
    jsonb_build_object('status', final_status, 'amount_cents', amount_cents, 'stripe_refund_id', stripe_refund_id),
    reason
  );

  return v_refund_id;
end;
$$;

-- Chargeback/dispute exception. Callable manually by staff, or by the
-- Stripe webhook handler on charge.dispute.created (system actor, no
-- auth.uid()). Preserves custody and fulfillment history -- only order
-- status changes.
create function public.mark_order_disputed(
  target_order_id uuid,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_previous_status public.order_status;
begin
  select organization_id, status into v_org_id, v_previous_status
  from public.orders where id = target_order_id;

  if v_org_id is null then
    raise exception 'Order not found';
  end if;

  -- Callable by an org admin (staff manually flagging a dispute) or by the
  -- Stripe webhook handler, which has no auth.uid() at all (service-role
  -- requests carry no user JWT). A non-admin authenticated user always has
  -- a non-null auth.uid(), so this cannot be used to let an arbitrary
  -- logged-in user dispute someone else's order.
  if auth.uid() is not null and not public.is_org_admin(v_org_id) then
    raise exception 'Not authorized to mark this order disputed';
  end if;

  update public.orders
  set status = 'DISPUTED', updated_at = now()
  where id = target_order_id;

  perform public.record_audit_log(
    v_org_id, 'order_disputed', 'order', target_order_id,
    jsonb_build_object('status', v_previous_status),
    jsonb_build_object('status', 'DISPUTED'),
    reason
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Security hardening: several Phase 4/6/7 functions have no internal
-- authorization check because they were designed to be called only via the
-- service-role client (guests have no auth session to satisfy RLS/auth.uid()
-- checks). But Postgres grants EXECUTE to every role by default, so without
-- this, any anon/authenticated client could call them directly through
-- Supabase's REST API against an arbitrary order/product id. Restrict them
-- to service_role only -- the only role the application actually uses to
-- call them.
-- ---------------------------------------------------------------------------
revoke execute on function public.reserve_inventory_for_order_item(uuid, uuid, uuid, integer) from public;
revoke execute on function public.release_order_reservations(uuid) from public;
revoke execute on function public.release_expired_reservations() from public;
revoke execute on function public.finalize_paid_order(uuid) from public;
revoke execute on function public.select_ship_or_donate(uuid, text) from public;
revoke execute on function public.confirm_donation_back(uuid, text) from public;
revoke execute on function public.submit_shipping_address(uuid, jsonb) from public;

grant execute on function public.reserve_inventory_for_order_item(uuid, uuid, uuid, integer) to service_role;
grant execute on function public.release_order_reservations(uuid) to service_role;
grant execute on function public.release_expired_reservations() to service_role;
grant execute on function public.finalize_paid_order(uuid) to service_role;
grant execute on function public.select_ship_or_donate(uuid, text) to service_role;
grant execute on function public.confirm_donation_back(uuid, text) to service_role;
grant execute on function public.submit_shipping_address(uuid, jsonb) to service_role;

-- generate_pack_id() (Phase 2) had no internal check either: it was only
-- ever called with the caller's own authenticated session (not service
-- role), so any authenticated user of any organization could advance
-- another organization's Pack ID sequence. Add the missing check.
create or replace function public.generate_pack_id(target_org_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  seq_value bigint;
begin
  if not public.is_org_admin(target_org_id) then
    raise exception 'Not authorized to generate a Pack ID for this organization';
  end if;

  insert into public.pack_id_sequences (organization_id, next_value)
  values (target_org_id, 2)
  on conflict (organization_id)
    do update set next_value = public.pack_id_sequences.next_value + 1
  returning next_value - 1 into seq_value;

  return 'PACK-' || lpad(seq_value::text, 6, '0');
end;
$$;
