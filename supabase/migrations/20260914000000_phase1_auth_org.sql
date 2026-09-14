-- Phase 1: Authentication & Organization
-- Tables: organizations, profiles, organization_members
-- Baseline RLS: default-deny, org-scoped access.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_slug_unique unique (slug)
);

comment on table public.organizations is 'Nonprofit/operator tenant.';

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Application-level user profile mapped 1:1 to auth.users.';

-- Auto-create a profile row whenever a new auth user is created.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- organization_members
-- ---------------------------------------------------------------------------
create type public.org_role as enum (
  'supporter',
  'event_host',
  'fulfillment_staff',
  'support_staff',
  'admin',
  'org_owner'
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.org_role not null,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_org_user_unique unique (organization_id, user_id)
);

comment on table public.organization_members is 'Staff role/membership within an organization. Supporter role is not expected here in practice (supporters are customers, not staff), but is included for completeness with the spec role list.';

create index organization_members_org_role_idx
  on public.organization_members (organization_id, role);

create index organization_members_user_idx
  on public.organization_members (user_id);

-- ---------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER to avoid RLS self-recursion)
-- ---------------------------------------------------------------------------
create function public.is_org_member(target_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create function public.is_org_admin(target_org_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = target_org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role in ('admin', 'org_owner')
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;

-- organizations: members can read their own org; only admin/owner can update it.
create policy organizations_select_members
  on public.organizations for select
  to authenticated
  using (public.is_org_member(id));

create policy organizations_update_admins
  on public.organizations for update
  to authenticated
  using (public.is_org_admin(id))
  with check (public.is_org_admin(id));

-- profiles: a user can always read/update their own profile; org staff can
-- read profiles of fellow members within any org they share.
create policy profiles_select_self
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy profiles_select_org_peers
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members mine
      join public.organization_members theirs
        on theirs.organization_id = mine.organization_id
      where mine.user_id = auth.uid()
        and mine.status = 'active'
        and theirs.user_id = public.profiles.id
        and theirs.status = 'active'
    )
  );

create policy profiles_update_self
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- organization_members: members can see the roster of orgs they belong to;
-- only admin/owner can add, change, or remove members.
create policy organization_members_select_peers
  on public.organization_members for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy organization_members_insert_admins
  on public.organization_members for insert
  to authenticated
  with check (public.is_org_admin(organization_id));

create policy organization_members_update_admins
  on public.organization_members for update
  to authenticated
  using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

create policy organization_members_delete_admins
  on public.organization_members for delete
  to authenticated
  using (public.is_org_admin(organization_id));
