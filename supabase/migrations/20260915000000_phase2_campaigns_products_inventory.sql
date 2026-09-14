-- Phase 2: Campaign, Product, Storage Location, and Receive Inventory
-- Tables: campaigns, products, storage_locations, inventory_units
-- Plus: per-org Pack ID sequence + generator function, RLS.

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  beneficiary_statement text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_org_slug_unique unique (organization_id, slug)
);

create index campaigns_org_status_idx on public.campaigns (organization_id, status);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  name text not null,
  slug text not null,
  description text,
  price_cents integer not null check (price_cents >= 0),
  currency text not null default 'usd',
  is_pack_tracked boolean not null default true,
  contents_vary boolean not null default true,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  disclosure_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_org_slug_unique unique (organization_id, slug)
);

comment on column public.products.is_pack_tracked is
  'MVP requires this to be true: individually tracked inventory, one row per physical pack. Quantity-only stock is not supported.';

create index products_campaign_status_idx on public.products (campaign_id, status);
create index products_org_idx on public.products (organization_id);

-- ---------------------------------------------------------------------------
-- storage_locations
-- ---------------------------------------------------------------------------
create table public.storage_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  type text not null check (type in ('warehouse', 'room', 'shelf', 'bin', 'case')),
  parent_location_id uuid references public.storage_locations (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  constraint storage_locations_org_name_unique unique (organization_id, name)
);

-- ---------------------------------------------------------------------------
-- inventory_units (Pack IDs)
-- ---------------------------------------------------------------------------
create type public.inventory_unit_status as enum (
  'AVAILABLE',
  'CHECKOUT_RESERVED',
  'SOLD',
  'ASSIGNED',
  'QUEUED',
  'OPENING',
  'OPENED',
  'FULFILLMENT_PENDING',
  'SHIPPED',
  'DONATED_BACK',
  'DAMAGED',
  'MISSING',
  'VOIDED'
);

create table public.inventory_units (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  storage_location_id uuid references public.storage_locations (id) on delete set null,
  pack_id text not null,
  vendor_barcode text,
  status public.inventory_unit_status not null default 'AVAILABLE',
  supplier_source text,
  lot_case_reference text,
  condition text not null default 'sealed' check (condition in ('sealed', 'damaged', 'other')),
  unit_cost_cents integer check (unit_cost_cents >= 0),
  photo_url text,
  notes text,
  received_by uuid references public.profiles (id),
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_units_org_pack_id_unique unique (organization_id, pack_id)
);

comment on constraint inventory_units_org_pack_id_unique on public.inventory_units is
  'Enforces the non-negotiable rule: every physical pack has a permanent unique Pack ID. Do not drop or weaken this constraint.';

create index inventory_units_org_status_idx on public.inventory_units (organization_id, status);
create index inventory_units_product_idx on public.inventory_units (product_id);
create index inventory_units_storage_location_idx on public.inventory_units (storage_location_id);

-- ---------------------------------------------------------------------------
-- Pack ID generation: atomic per-organization sequence -> "PACK-000001"
-- ---------------------------------------------------------------------------
create table public.pack_id_sequences (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  next_value bigint not null default 1
);

create function public.generate_pack_id(target_org_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  seq_value bigint;
begin
  insert into public.pack_id_sequences (organization_id, next_value)
  values (target_org_id, 2)
  on conflict (organization_id)
    do update set next_value = public.pack_id_sequences.next_value + 1
  returning next_value - 1 into seq_value;

  return 'PACK-' || lpad(seq_value::text, 6, '0');
end;
$$;

comment on function public.generate_pack_id is
  'Atomically reserves the next sequential Pack ID for an organization. Human-readable only; uniqueness is enforced by inventory_units_org_pack_id_unique regardless of how a Pack ID was produced (generated or manually entered/scanned).';

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.campaigns enable row level security;
alter table public.products enable row level security;
alter table public.storage_locations enable row level security;
alter table public.inventory_units enable row level security;
alter table public.pack_id_sequences enable row level security;

-- campaigns: any active org member can read; only admin/owner can write.
create policy campaigns_select_members
  on public.campaigns for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy campaigns_insert_admins
  on public.campaigns for insert
  to authenticated
  with check (public.is_org_admin(organization_id));

create policy campaigns_update_admins
  on public.campaigns for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

-- products: same pattern as campaigns.
create policy products_select_members
  on public.products for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy products_insert_admins
  on public.products for insert
  to authenticated
  with check (public.is_org_admin(organization_id));

create policy products_update_admins
  on public.products for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

-- storage_locations: any active org member can read; only admin/owner can write.
create policy storage_locations_select_members
  on public.storage_locations for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy storage_locations_insert_admins
  on public.storage_locations for insert
  to authenticated
  with check (public.is_org_admin(organization_id));

create policy storage_locations_update_admins
  on public.storage_locations for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

-- inventory_units: any active org member can read (needed later by hosts,
-- fulfillment, etc.); only admin/owner can create or edit in the MVP
-- Receive Inventory flow. Corrections after receipt are still admin-only and
-- should route through audited actions once Phase 8 lands.
create policy inventory_units_select_members
  on public.inventory_units for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy inventory_units_insert_admins
  on public.inventory_units for insert
  to authenticated
  with check (public.is_org_admin(organization_id));

create policy inventory_units_update_admins
  on public.inventory_units for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

-- pack_id_sequences: no direct client access; only the SECURITY DEFINER
-- generate_pack_id() function touches this table.
create policy pack_id_sequences_no_access
  on public.pack_id_sequences for all
  to authenticated
  using (false)
  with check (false);
