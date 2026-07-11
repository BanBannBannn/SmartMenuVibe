-- =============================================================================
-- SmartMenu - Admin account management support
-- Adds an email column to profiles (mirrored from auth.users) so the platform
-- super-admin console can list & manage accounts without querying auth schema.
-- =============================================================================

alter table public.profiles add column if not exists email text;

-- Keep email in sync on signup (extend the existing handle_new_user trigger).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::app_role, 'owner')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;

-- Backfill existing profiles from auth.users (migration runs as a privileged
-- role, so it can read the auth schema here).
update public.profiles p
  set email = u.email
  from auth.users u
  where u.id = p.id and p.email is distinct from u.email;
