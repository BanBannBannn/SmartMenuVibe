-- =============================================================================
-- SmartMenu - Helper functions & triggers
-- =============================================================================

-- Auto-update updated_at ------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','restaurants','menus','menu_items','orders']
  loop
    execute format(
      'drop trigger if exists trg_%1$s_updated on public.%1$s;
       create trigger trg_%1$s_updated before update on public.%1$s
       for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- Create profile automatically when a new auth user signs up ------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::app_role, 'owner')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: does the current user have access to a restaurant? ------------------
-- SECURITY DEFINER + stable so it can be referenced inside RLS policies
-- without causing infinite recursion on restaurant_staff.
create or replace function public.has_restaurant_access(p_restaurant_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.restaurants r
    where r.id = p_restaurant_id and r.owner_id = auth.uid()
  ) or exists (
    select 1 from public.restaurant_staff s
    where s.restaurant_id = p_restaurant_id and s.user_id = auth.uid()
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'super_admin'
  );
$$;

-- Recalculate order totals from its items -------------------------------------
create or replace function public.recalc_order_totals(p_order_id uuid)
returns void language plpgsql as $$
declare v_subtotal numeric(12,2);
begin
  select coalesce(sum(unit_price * quantity), 0) into v_subtotal
  from public.order_items where order_id = p_order_id;
  update public.orders
    set subtotal = v_subtotal, total = v_subtotal, updated_at = now()
  where id = p_order_id;
end $$;

-- Roll up completed orders into the daily revenue summary ---------------------
create or replace function public.bump_revenue_summary()
returns trigger language plpgsql as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    insert into public.revenue_daily_summary (restaurant_id, date, total_orders, total_revenue)
    values (new.restaurant_id, (new.updated_at at time zone 'UTC')::date, 1, new.total)
    on conflict (restaurant_id, date) do update
      set total_orders = public.revenue_daily_summary.total_orders + 1,
          total_revenue = public.revenue_daily_summary.total_revenue + excluded.total_revenue;
  end if;
  return new;
end $$;

drop trigger if exists trg_orders_revenue on public.orders;
create trigger trg_orders_revenue after update on public.orders
  for each row execute function public.bump_revenue_summary();
