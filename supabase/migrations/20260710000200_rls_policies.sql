-- =============================================================================
-- SmartMenu - Row Level Security (Plan section 8.1)
-- Rule: enable RLS on EVERY table. Owner/staff only touch their restaurant's
-- rows; guests can only READ available items of active menus.
-- =============================================================================

alter table public.profiles              enable row level security;
alter table public.restaurants           enable row level security;
alter table public.restaurant_staff      enable row level security;
alter table public.menu_templates        enable row level security;
alter table public.menus                 enable row level security;
alter table public.menu_categories       enable row level security;
alter table public.menu_items            enable row level security;
alter table public.menu_item_variants    enable row level security;
alter table public.tables                enable row level security;
alter table public.guest_profiles        enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.recommendation_rules  enable row level security;
alter table public.face_scan_logs        enable row level security;
alter table public.notifications         enable row level security;
alter table public.audit_logs            enable row level security;
alter table public.revenue_daily_summary enable row level security;

-- profiles --------------------------------------------------------------------
create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid() or public.is_super_admin());
create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid());
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_super_admin());

-- menu_templates: readable by everyone (public theme library) -----------------
create policy "templates_public_read" on public.menu_templates
  for select using (true);
create policy "templates_admin_write" on public.menu_templates
  for all using (public.is_super_admin());

-- restaurants -----------------------------------------------------------------
create policy "restaurants_public_read_active" on public.restaurants
  for select using (status = 'active' or public.has_restaurant_access(id) or public.is_super_admin());
create policy "restaurants_owner_insert" on public.restaurants
  for insert with check (owner_id = auth.uid());
create policy "restaurants_owner_update" on public.restaurants
  for update using (owner_id = auth.uid() or public.is_super_admin());
create policy "restaurants_admin_delete" on public.restaurants
  for delete using (owner_id = auth.uid() or public.is_super_admin());

-- restaurant_staff ------------------------------------------------------------
create policy "staff_read" on public.restaurant_staff
  for select using (user_id = auth.uid() or public.has_restaurant_access(restaurant_id) or public.is_super_admin());
create policy "staff_manage" on public.restaurant_staff
  for all using (
    exists (select 1 from public.restaurants r where r.id = restaurant_id and r.owner_id = auth.uid())
    or public.is_super_admin()
  );

-- Generic pattern for restaurant-scoped content tables ------------------------
-- menus / categories / items / variants / tables / rules
create policy "menus_staff_all" on public.menus
  for all using (public.has_restaurant_access(restaurant_id) or public.is_super_admin())
  with check (public.has_restaurant_access(restaurant_id));
create policy "menus_public_read" on public.menus
  for select using (is_active = true);

create policy "categories_staff_all" on public.menu_categories
  for all using (public.has_restaurant_access(restaurant_id) or public.is_super_admin())
  with check (public.has_restaurant_access(restaurant_id));
create policy "categories_public_read" on public.menu_categories
  for select using (true);

create policy "items_staff_all" on public.menu_items
  for all using (public.has_restaurant_access(restaurant_id) or public.is_super_admin())
  with check (public.has_restaurant_access(restaurant_id));
-- Guest (anon) may only READ available items.
create policy "items_public_read_available" on public.menu_items
  for select using (is_available = true);

create policy "variants_staff_all" on public.menu_item_variants
  for all using (
    exists (select 1 from public.menu_items mi
            where mi.id = menu_item_id and public.has_restaurant_access(mi.restaurant_id))
    or public.is_super_admin()
  );
create policy "variants_public_read" on public.menu_item_variants
  for select using (true);

create policy "tables_staff_all" on public.tables
  for all using (public.has_restaurant_access(restaurant_id) or public.is_super_admin())
  with check (public.has_restaurant_access(restaurant_id));
-- Guests resolve a table via its qr_code_token on the server (service role),
-- so no broad public read is granted here.

create policy "rules_staff_all" on public.recommendation_rules
  for all using (public.has_restaurant_access(restaurant_id) or public.is_super_admin())
  with check (public.has_restaurant_access(restaurant_id));
create policy "rules_public_read_active" on public.recommendation_rules
  for select using (is_active = true);

-- guest_profiles: only staff of the restaurant (and service role) -------------
create policy "guests_staff_all" on public.guest_profiles
  for all using (public.has_restaurant_access(restaurant_id) or public.is_super_admin())
  with check (public.has_restaurant_access(restaurant_id));

-- orders ----------------------------------------------------------------------
-- Staff of the restaurant can read/manage. Guest order creation & tracking is
-- performed server-side via the service role (see lib/supabase/admin).
create policy "orders_staff_all" on public.orders
  for all using (public.has_restaurant_access(restaurant_id) or public.is_super_admin())
  with check (public.has_restaurant_access(restaurant_id));

create policy "order_items_staff_all" on public.order_items
  for all using (
    exists (select 1 from public.orders o
            where o.id = order_id and public.has_restaurant_access(o.restaurant_id))
    or public.is_super_admin()
  );

-- face_scan_logs --------------------------------------------------------------
create policy "facelogs_staff_read" on public.face_scan_logs
  for select using (public.has_restaurant_access(restaurant_id) or public.is_super_admin());

-- notifications ---------------------------------------------------------------
create policy "notifications_recipient" on public.notifications
  for all using (recipient_id = auth.uid() or public.is_super_admin());

-- audit_logs: super admin only ------------------------------------------------
create policy "audit_admin_read" on public.audit_logs
  for select using (public.is_super_admin());

-- revenue_daily_summary -------------------------------------------------------
create policy "revenue_staff_read" on public.revenue_daily_summary
  for select using (public.has_restaurant_access(restaurant_id) or public.is_super_admin());
