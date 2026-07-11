-- =============================================================================
-- SmartMenu - Storage buckets & policies (Plan Phase 0)
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('menu-images', 'menu-images', true),
  ('restaurant-branding', 'restaurant-branding', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read for all three buckets (images are shown on public menus) --------
create policy "public_read_menu_images" on storage.objects
  for select using (bucket_id in ('menu-images','restaurant-branding','avatars'));

-- Authenticated users may upload; folder convention: <restaurant_id>/<file>
create policy "authenticated_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('menu-images','restaurant-branding','avatars'));

create policy "authenticated_update_own" on storage.objects
  for update to authenticated
  using (bucket_id in ('menu-images','restaurant-branding','avatars') and owner = auth.uid());

create policy "authenticated_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id in ('menu-images','restaurant-branding','avatars') and owner = auth.uid());
