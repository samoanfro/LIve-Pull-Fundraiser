-- Phase 3: Storefront
-- Allow public (anon + authenticated) read access to published campaigns and
-- published products, without exposing inventory_units (cost, supplier,
-- notes, etc. stay staff-only). Also add an availability count function so
-- the storefront can show in-stock/sold-out without exposing pack rows.

create policy campaigns_select_public
  on public.campaigns for select
  to anon, authenticated
  using (status = 'published');

create policy products_select_public
  on public.products for select
  to anon, authenticated
  using (status = 'published');

create function public.available_inventory_count(target_product_id uuid)
returns bigint
language sql
security definer
stable
set search_path = public
as $$
  select count(*)
  from public.inventory_units
  where product_id = target_product_id
    and status = 'AVAILABLE';
$$;

comment on function public.available_inventory_count is
  'Public-safe aggregate for storefront availability display. Does not expose individual inventory_units rows (cost, supplier, notes, etc. stay staff-only).';
