-- =============================================================================
-- SmartMenu - Seed data (theme templates + demo restaurant)
-- Run after migrations. Safe to run multiple times (on conflict do nothing).
-- NOTE: demo auth users must be created via Supabase Auth (see README) - this
-- seed only inserts the shared theme templates that need no auth user.
-- =============================================================================

insert into public.menu_templates (id, name, description, font_config, color_palette, card_style, is_system)
values
  (
    '11111111-1111-1111-1111-111111111101',
    'Toi gian hien dai',
    'Nen sang, nhieu khoang trong, font sans sach se',
    '{"sans":"Inter","display":"Inter"}',
    '{"primary":"24 96% 53%","background":"0 0% 100%","foreground":"240 10% 3.9%"}',
    '{"radius":"0.75rem","shadow":"sm","imageRatio":"4/3"}',
    true
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    'Sang trong nen toi',
    'Nen toi, tuong phan cao, cam giac fine-dining',
    '{"sans":"Inter","display":"Playfair Display"}',
    '{"primary":"43 74% 52%","background":"240 10% 3.9%","foreground":"0 0% 98%"}',
    '{"radius":"0.5rem","shadow":"lg","imageRatio":"1/1"}',
    true
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    'Tre trung nhieu mau',
    'Mau pastel tuoi sang, hop tra sua / do uong',
    '{"sans":"Nunito","display":"Nunito"}',
    '{"primary":"330 81% 60%","background":"330 100% 98%","foreground":"330 30% 20%"}',
    '{"radius":"1.5rem","shadow":"md","imageRatio":"4/3"}',
    true
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    'Am cung / quan lau',
    'Tong am (do/cam), hop quan lau, do nong',
    '{"sans":"Be Vietnam Pro","display":"Be Vietnam Pro"}',
    '{"primary":"12 88% 45%","background":"20 40% 97%","foreground":"20 30% 15%"}',
    '{"radius":"0.75rem","shadow":"md","imageRatio":"4/3"}',
    true
  )
on conflict (id) do nothing;
