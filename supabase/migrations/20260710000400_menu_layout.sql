-- Menu layout (WYSIWYG builder) ---------------------------------------------
-- Stores the free-form canvas arrangement designed by the owner:
--   { "template": "grid" | "list" | "magazine" | "free",
--     "positions": { "<item_id>": { "x": 8, "y": 8, "w": 200 } } }
-- Positions are pixel coordinates on a fixed A4-style design canvas.
alter table public.menus
  add column if not exists layout jsonb not null default '{}'::jsonb;
