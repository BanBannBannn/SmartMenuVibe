-- Remove the face-scan feature and every column/table that held biometric data.
-- Dropping the table also drops its RLS policy and index; dropping a column
-- drops the index on it.

drop table if exists public.face_scan_logs;

alter table public.guest_profiles
  drop column if exists face_person_id,
  drop column if exists opted_in_face;

alter table public.restaurants
  drop column if exists face_enabled;
