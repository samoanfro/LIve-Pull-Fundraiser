-- Private storage bucket for Receive Inventory photos.
-- Object path convention: "<organization_id>/<uuid>-<filename>".

insert into storage.buckets (id, name, public)
values ('inventory-photos', 'inventory-photos', false)
on conflict (id) do nothing;

create policy inventory_photos_insert_admins
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'inventory-photos'
    and public.is_org_admin((storage.foldername(name))[1]::uuid)
  );

create policy inventory_photos_select_members
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'inventory-photos'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );
