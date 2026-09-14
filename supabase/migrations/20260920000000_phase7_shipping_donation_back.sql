-- Phase 7: Shipping and Donation Back
-- Tables: shipping_requests, donation_backs, donation_back_items
--
-- Chain of custody continues: pulled_items -> donation_back_items (donate
-- path) or order -> shipping_requests (ship path). Provenance back to the
-- original pack/order/customer/opening is never removed, even if disposition
-- changes later (Phase 8 handles disposition corrections with audit trail).

-- ---------------------------------------------------------------------------
-- shipping_requests
-- ---------------------------------------------------------------------------
create table public.shipping_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  status text not null default 'REQUESTED' check (status in (
    'REQUESTED', 'ADDRESS_CONFIRMED', 'LABEL_CREATED', 'PACKED', 'SHIPPED', 'DELIVERED', 'EXCEPTION'
  )),
  address_json jsonb,
  carrier text,
  service text,
  tracking_number text,
  label_reference text,
  requested_at timestamptz not null default now(),
  shipped_at timestamptz,
  delivered_at timestamptz,
  constraint shipping_requests_order_unique unique (order_id)
);

create index shipping_requests_status_idx on public.shipping_requests (status);
create index shipping_requests_customer_idx on public.shipping_requests (customer_id);

-- ---------------------------------------------------------------------------
-- donation_backs
-- ---------------------------------------------------------------------------
create table public.donation_backs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  confirmed_at timestamptz not null default now(),
  policy_version_accepted text not null,
  disposition_status text check (disposition_status in (
    'RECEIVED_RETAINED', 'STORED', 'REUSED_IN_FUNDRAISER',
    'SOLD_SEPARATELY_WHERE_ALLOWED', 'DONATED_EXTERNALLY', 'DISPOSED', 'OTHER_WITH_NOTE'
  )),
  disposition_note text,
  constraint donation_backs_order_unique unique (order_id)
);

comment on column public.donation_backs.disposition_status is
  'Null until staff record what happened to the items (Phase 7/8 admin action). Never automatically inferred or defaulted.';

create index donation_backs_customer_idx on public.donation_backs (customer_id);
create index donation_backs_disposition_idx on public.donation_backs (disposition_status);

-- ---------------------------------------------------------------------------
-- donation_back_items
-- ---------------------------------------------------------------------------
create table public.donation_back_items (
  id uuid primary key default gen_random_uuid(),
  donation_back_id uuid not null references public.donation_backs (id) on delete restrict,
  pulled_item_id uuid not null references public.pulled_items (id) on delete restrict,
  constraint donation_back_items_pulled_item_unique unique (pulled_item_id)
);

comment on constraint donation_back_items_pulled_item_unique on public.donation_back_items is
  'A pulled item can be donated back at most once -- preserves a permanent, unambiguous provenance link even if disposition changes later.';

-- ---------------------------------------------------------------------------
-- Role helper: who may manage the shipping queue.
-- ---------------------------------------------------------------------------
create function public.can_manage_shipping(target_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_org_admin(target_org_id)
    or exists (
      select 1
      from public.organization_members m
      where m.organization_id = target_org_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and m.role = 'fulfillment_staff'
    );
$$;

-- ---------------------------------------------------------------------------
-- confirm_donation_back: customer explicitly confirms donating items back.
-- Idempotent: re-confirming an already-confirmed order is a no-op (does not
-- create duplicate donation_back_items).
-- ---------------------------------------------------------------------------
create function public.confirm_donation_back(
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
  v_donation_back_id uuid;
begin
  select customer_id into v_customer_id from public.orders where id = target_order_id;

  if v_customer_id is null then
    raise exception 'Order not found';
  end if;

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

  return v_donation_back_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- submit_shipping_address: customer confirms their shipping address.
-- Idempotent: resubmitting updates the same row (unique on order_id).
-- ---------------------------------------------------------------------------
create function public.submit_shipping_address(
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
  v_request_id uuid;
begin
  select customer_id into v_customer_id from public.orders where id = target_order_id;

  if v_customer_id is null then
    raise exception 'Order not found';
  end if;

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

  return v_request_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- update_shipping_fulfillment: staff records carrier/tracking/status as the
-- physical shipment progresses.
-- ---------------------------------------------------------------------------
create function public.update_shipping_fulfillment(
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

  if new_status = 'SHIPPED' then
    update public.orders set status = 'SHIPPED', updated_at = now() where id = v_order_id;
  elsif new_status = 'DELIVERED' then
    update public.orders set status = 'COMPLETED', updated_at = now() where id = v_order_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- set_donation_disposition: staff records what happened to donated items.
-- ---------------------------------------------------------------------------
create function public.set_donation_disposition(
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
begin
  select o.organization_id, db.order_id into v_org_id, v_order_id
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

  update public.orders set status = 'COMPLETED', updated_at = now() where id = v_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.shipping_requests enable row level security;
alter table public.donation_backs enable row level security;
alter table public.donation_back_items enable row level security;

create policy shipping_requests_select_org_staff
  on public.shipping_requests for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = public.shipping_requests.order_id
        and public.is_org_member(o.organization_id)
    )
  );

create policy shipping_requests_select_own_customer
  on public.shipping_requests for select
  to authenticated
  using (
    exists (
      select 1 from public.customers c
      where c.id = public.shipping_requests.customer_id
        and c.profile_id = auth.uid()
    )
  );

create policy donation_backs_select_org_staff
  on public.donation_backs for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = public.donation_backs.order_id
        and public.is_org_member(o.organization_id)
    )
  );

create policy donation_backs_select_own_customer
  on public.donation_backs for select
  to authenticated
  using (
    exists (
      select 1 from public.customers c
      where c.id = public.donation_backs.customer_id
        and c.profile_id = auth.uid()
    )
  );

create policy donation_back_items_select_org_staff
  on public.donation_back_items for select
  to authenticated
  using (
    exists (
      select 1 from public.donation_backs db
      join public.orders o on o.id = db.order_id
      where db.id = public.donation_back_items.donation_back_id
        and public.is_org_member(o.organization_id)
    )
  );

create policy donation_back_items_select_own_customer
  on public.donation_back_items for select
  to authenticated
  using (
    exists (
      select 1 from public.donation_backs db
      join public.customers c on c.id = db.customer_id
      where db.id = public.donation_back_items.donation_back_id
        and c.profile_id = auth.uid()
    )
  );
