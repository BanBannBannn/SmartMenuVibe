-- Prevent authenticated users from escalating their own platform role through
-- direct PostgREST calls. Super admins may still manage roles via admin tools.
create or replace function public.protect_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and not public.is_super_admin() then
    raise exception 'Only a super admin can change profile roles';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_profile_role_change() from public;

create trigger protect_profile_role_before_update
before update on public.profiles
for each row
execute function public.protect_profile_role_change();
