-- =============================================================================
-- SmartMenu - Initial schema (Plan section 6)
-- Convention: table/column names in English; documentation in Vietnamese.
-- =============================================================================

create extension if not exists "pgcrypto";

-- Enums -----------------------------------------------------------------------
do $$ begin
  create type app_role as enum ('super_admin', 'owner', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type staff_role as enum ('manager', 'waiter', 'kitchen');
exception when duplicate_object then null; end $$;

do $$ begin
  create type restaurant_status as enum ('pending', 'active', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type rule_type as enum ('time_of_day', 'weather', 'combo', 'best_seller');
exception when duplicate_object then null; end $$;

-- profiles: extends auth.users -----------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'owner',
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- restaurants -----------------------------------------------------------------
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  description text,
  logo_url text,
  cover_url text,
  address text,
  city text,                       -- used for weather lookups (section 7.3)
  lat double precision,
  lon double precision,
  opening_hours jsonb default '{}'::jsonb,
  theme_settings jsonb default '{}'::jsonb,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  status restaurant_status not null default 'pending',
  face_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_restaurants_owner on public.restaurants(owner_id);
create index if not exists idx_restaurants_status on public.restaurants(status);

-- restaurant_staff ------------------------------------------------------------
create table if not exists public.restaurant_staff (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role staff_role not null default 'waiter',
  created_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);
create index if not exists idx_staff_user on public.restaurant_staff(user_id);
create index if not exists idx_staff_restaurant on public.restaurant_staff(restaurant_id);

-- menu_templates (shared theme library) --------------------------------------
create table if not exists public.menu_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  font_config jsonb not null default '{}'::jsonb,
  color_palette jsonb not null default '{}'::jsonb,
  card_style jsonb not null default '{}'::jsonb,
  preview_image_url text,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

-- menus -----------------------------------------------------------------------
create table if not exists public.menus (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  schedule_rules jsonb default '{}'::jsonb,     -- { "start": "06:00", "end": "10:30", "days": [1,2,3] }
  theme_template_id uuid references public.menu_templates(id) on delete set null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_menus_restaurant on public.menus(restaurant_id);

-- menu_categories -------------------------------------------------------------
create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_categories_menu on public.menu_categories(menu_id);

-- menu_items ------------------------------------------------------------------
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  base_price numeric(12,2) not null default 0 check (base_price >= 0),
  images text[] not null default '{}',
  tags text[] not null default '{}',           -- best_seller / new / spicy / vegetarian
  is_available boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_items_category on public.menu_items(category_id);
create index if not exists idx_items_restaurant on public.menu_items(restaurant_id);
create index if not exists idx_items_available on public.menu_items(is_available);

-- menu_item_variants ----------------------------------------------------------
create table if not exists public.menu_item_variants (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  name text not null,
  price_delta numeric(12,2) not null default 0,
  sort_order int not null default 0
);
create index if not exists idx_variants_item on public.menu_item_variants(menu_item_id);

-- tables (dining tables + QR) -------------------------------------------------
create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_number text not null,
  qr_code_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  seats int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (restaurant_id, table_number)
);
create index if not exists idx_tables_restaurant on public.tables(restaurant_id);

-- guest_profiles (opt-in "remember me") --------------------------------------
create table if not exists public.guest_profiles (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  face_person_id text,             -- Azure PersonGroup Person ID (only if Identify approved)
  phone text,
  display_name text,
  preferences jsonb default '{}'::jsonb,
  opted_in_face boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_guests_restaurant on public.guest_profiles(restaurant_id);
create index if not exists idx_guests_face on public.guest_profiles(face_person_id);

-- orders ----------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid references public.tables(id) on delete set null,
  guest_profile_id uuid references public.guest_profiles(id) on delete set null,
  status order_status not null default 'pending',
  device_token text,               -- anonymous guest device id, used for rate limiting & tracking
  note text,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_orders_restaurant on public.orders(restaurant_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at);
create index if not exists idx_orders_device on public.orders(device_token);

-- order_items -----------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  variant_id uuid references public.menu_item_variants(id) on delete set null,
  name_snapshot text not null,     -- snapshot in case the item is later renamed/deleted
  quantity int not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  note text
);
create index if not exists idx_order_items_order on public.order_items(order_id);

-- recommendation_rules --------------------------------------------------------
create table if not exists public.recommendation_rules (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  rule_type rule_type not null,
  name text not null,
  conditions jsonb not null default '{}'::jsonb,  -- { "from":"18:00","to":"22:00" } or { "weather":["rain","cold"] }
  suggested_item_ids uuid[] not null default '{}',
  priority int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_rules_restaurant on public.recommendation_rules(restaurant_id);

-- face_scan_logs (legal transparency - section 8.3) --------------------------
create table if not exists public.face_scan_logs (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  matched boolean not null default false,
  consent_given boolean not null default false,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
create index if not exists idx_facelogs_restaurant on public.face_scan_logs(restaurant_id);

-- notifications ---------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  type text not null,
  payload jsonb default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_recipient on public.notifications(recipient_id);

-- audit_logs (Super Admin) ----------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_actor on public.audit_logs(actor_user_id);

-- revenue_daily_summary (aggregate table, refreshed by trigger/cron) ----------
create table if not exists public.revenue_daily_summary (
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  date date not null,
  total_orders int not null default 0,
  total_revenue numeric(14,2) not null default 0,
  primary key (restaurant_id, date)
);
