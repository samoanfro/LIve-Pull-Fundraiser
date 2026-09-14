-- Phase 5: Opening Sessions and Opening Queue
-- Tables: events, opening_sessions, opening_queue, opened_packs, pulled_items
--
-- Chain of custody continues: order_inventory_assignments -> opening_queue ->
-- opened_packs -> pulled_items. Pack confirmation, opening start, and
-- opening completion are only ever performed through the SECURITY DEFINER
-- functions below -- never by direct table writes from the client -- so
-- that "block on mismatch, never silently substitute" and "locked after
-- completion" are enforced in one place, not re-implemented per caller.

-- ---------------------------------------------------------------------------
-- events (minimal; scheduled fundraiser/opening events)
-- ---------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  title text not null,
  scheduled_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index events_org_idx on public.events (organization_id);

-- ---------------------------------------------------------------------------
-- Role helper: who may run openings (confirm packs, record pulls).
-- ---------------------------------------------------------------------------
create function public.can_manage_openings(target_org_id uuid)
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
        and m.role = 'event_host'
    );
$$;

-- ---------------------------------------------------------------------------
-- opening_sessions
-- ---------------------------------------------------------------------------
create table public.opening_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  event_id uuid references public.events (id) on delete set null,
  host_user_id uuid references public.profiles (id),
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'completed', 'cancelled')),
  livestream_url text,
  recording_url text,
  internal_notes text,
  created_at timestamptz not null default now()
);

create index opening_sessions_org_status_idx on public.opening_sessions (organization_id, status);

-- ---------------------------------------------------------------------------
-- opening_queue
-- ---------------------------------------------------------------------------
create table public.opening_queue (
  id uuid primary key default gen_random_uuid(),
  opening_session_id uuid not null references public.opening_sessions (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete restrict,
  order_item_id uuid not null references public.order_items (id) on delete restrict,
  inventory_unit_id uuid not null references public.inventory_units (id) on delete restrict,
  sequence_number integer not null,
  queue_status text not null default 'queued' check (queue_status in ('queued', 'in_progress', 'completed', 'exception')),
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  constraint opening_queue_session_unit_unique unique (opening_session_id, inventory_unit_id),
  constraint opening_queue_order_item_unique unique (order_item_id)
);

comment on constraint opening_queue_order_item_unique on public.opening_queue is
  'An order item can be queued for opening at most once -- prevents accidentally queuing the same paid item into two sessions.';

create index opening_queue_session_sequence_idx
  on public.opening_queue (opening_session_id, sequence_number);

-- ---------------------------------------------------------------------------
-- opened_packs
-- ---------------------------------------------------------------------------
create table public.opened_packs (
  id uuid primary key default gen_random_uuid(),
  inventory_unit_id uuid not null references public.inventory_units (id) on delete restrict,
  order_id uuid not null references public.orders (id) on delete restrict,
  order_item_id uuid not null references public.order_items (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  opening_session_id uuid not null references public.opening_sessions (id) on delete restrict,
  confirmed_pack_id_entered text not null,
  confirmed_by uuid references public.profiles (id),
  confirmed_at timestamptz not null default now(),
  opened_by uuid references public.profiles (id),
  opened_at timestamptz not null default now(),
  status text not null default 'confirmed' check (status in ('confirmed', 'locked')),
  constraint opened_packs_inventory_unit_unique unique (inventory_unit_id)
);

comment on constraint opened_packs_inventory_unit_unique on public.opened_packs is
  'A physical pack can be opened exactly once. Never insert a second row for the same inventory_unit_id.';

create index opened_packs_order_idx on public.opened_packs (order_id);
create index opened_packs_customer_idx on public.opened_packs (customer_id);

-- ---------------------------------------------------------------------------
-- pulled_items
-- ---------------------------------------------------------------------------
create table public.pulled_items (
  id uuid primary key default gen_random_uuid(),
  opened_pack_id uuid not null references public.opened_packs (id) on delete restrict,
  inventory_unit_id uuid not null references public.inventory_units (id) on delete restrict,
  order_id uuid not null references public.orders (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  title text not null,
  category text,
  description text,
  quantity integer not null default 1 check (quantity > 0),
  image_url text,
  external_reference text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index pulled_items_opened_pack_idx on public.pulled_items (opened_pack_id);
create index pulled_items_customer_idx on public.pulled_items (customer_id);
create index pulled_items_order_idx on public.pulled_items (order_id);

-- ---------------------------------------------------------------------------
-- add_order_item_to_opening_queue: load a PACK_ASSIGNED order item into a
-- session's queue.
-- ---------------------------------------------------------------------------
create function public.add_order_item_to_opening_queue(
  target_opening_session_id uuid,
  target_order_item_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_order_id uuid;
  v_unit_id uuid;
  v_next_seq integer;
  v_queue_id uuid;
begin
  select os.organization_id into v_org_id
  from public.opening_sessions os
  where os.id = target_opening_session_id;

  if v_org_id is null then
    raise exception 'Opening session not found';
  end if;

  if not public.is_org_admin(v_org_id) then
    raise exception 'Not authorized to manage the opening queue';
  end if;

  select oi.order_id, oia.inventory_unit_id
  into v_order_id, v_unit_id
  from public.order_items oi
  join public.order_inventory_assignments oia on oia.order_item_id = oi.id
  where oi.id = target_order_item_id;

  if v_unit_id is null then
    raise exception 'Order item has no assigned pack yet';
  end if;

  select coalesce(max(sequence_number), 0) + 1 into v_next_seq
  from public.opening_queue
  where opening_session_id = target_opening_session_id;

  insert into public.opening_queue (
    opening_session_id, order_id, order_item_id, inventory_unit_id, sequence_number
  )
  values (
    target_opening_session_id, v_order_id, target_order_item_id, v_unit_id, v_next_seq
  )
  returning id into v_queue_id;

  update public.inventory_units set status = 'QUEUED' where id = v_unit_id;
  update public.orders set status = 'QUEUED_FOR_OPENING', updated_at = now() where id = v_order_id;

  return v_queue_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- confirm_opening_queue_pack: host enters/scans the physical Pack ID.
-- Returns true on match (opening started), false on mismatch (blocked,
-- exception recorded -- never silently substitutes another pack).
-- ---------------------------------------------------------------------------
create function public.confirm_opening_queue_pack(
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

  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- add_pulled_item: record one pulled item against a confirmed (not yet
-- locked) opened pack.
-- ---------------------------------------------------------------------------
create function public.add_pulled_item(
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

  return v_pulled_item_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- complete_opening: lock the opened pack, mark queue/inventory complete,
-- and advance the order once all of its items are opened.
-- ---------------------------------------------------------------------------
create function public.complete_opening(target_opened_pack_id uuid)
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
    -- Already completed; idempotent no-op.
    return;
  end if;

  update public.opened_packs set status = 'locked' where id = target_opened_pack_id;
  update public.inventory_units set status = 'OPENED' where id = v_unit_id;

  update public.opening_queue
  set queue_status = 'completed', completed_at = now()
  where opening_session_id = v_session_id
    and order_item_id = v_order_item_id;

  select count(*) into v_total_items from public.order_items where order_id = v_order_id;
  select count(*) into v_opened_items
  from public.opened_packs
  where order_id = v_order_id and status = 'locked';

  if v_opened_items >= v_total_items then
    -- MVP simplification: once every item on the order has been opened,
    -- move straight to AWAITING_CUSTOMER_DECISION rather than pausing on a
    -- distinct OPENED state -- there is no separate action to take at
    -- OPENED before the customer is notified (Phase 6).
    update public.orders
    set status = 'AWAITING_CUSTOMER_DECISION', updated_at = now()
    where id = v_order_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.events enable row level security;
alter table public.opening_sessions enable row level security;
alter table public.opening_queue enable row level security;
alter table public.opened_packs enable row level security;
alter table public.pulled_items enable row level security;

create policy events_select_members
  on public.events for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy events_insert_admins
  on public.events for insert
  to authenticated
  with check (public.is_org_admin(organization_id));

create policy events_update_admins
  on public.events for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy opening_sessions_select_members
  on public.opening_sessions for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy opening_sessions_insert_admins
  on public.opening_sessions for insert
  to authenticated
  with check (public.is_org_admin(organization_id));

create policy opening_sessions_update_hosts
  on public.opening_sessions for update
  to authenticated
  using (public.can_manage_openings(organization_id))
  with check (public.can_manage_openings(organization_id));

-- opening_queue / opened_packs / pulled_items: read-only for org members via
-- RLS. All writes go exclusively through the SECURITY DEFINER functions
-- above, which perform their own authorization and business-rule checks.
create policy opening_queue_select_members
  on public.opening_queue for select
  to authenticated
  using (
    exists (
      select 1 from public.opening_sessions os
      where os.id = public.opening_queue.opening_session_id
        and public.is_org_member(os.organization_id)
    )
  );

create policy opened_packs_select_members
  on public.opened_packs for select
  to authenticated
  using (
    exists (
      select 1 from public.opening_sessions os
      where os.id = public.opened_packs.opening_session_id
        and public.is_org_member(os.organization_id)
    )
  );

create policy opened_packs_select_own_customer
  on public.opened_packs for select
  to authenticated
  using (
    exists (
      select 1 from public.customers c
      where c.id = public.opened_packs.customer_id
        and c.profile_id = auth.uid()
    )
  );

create policy pulled_items_select_members
  on public.pulled_items for select
  to authenticated
  using (
    exists (
      select 1 from public.opened_packs op
      join public.opening_sessions os on os.id = op.opening_session_id
      where op.id = public.pulled_items.opened_pack_id
        and public.is_org_member(os.organization_id)
    )
  );

create policy pulled_items_select_own_customer
  on public.pulled_items for select
  to authenticated
  using (
    exists (
      select 1 from public.customers c
      where c.id = public.pulled_items.customer_id
        and c.profile_id = auth.uid()
    )
  );
