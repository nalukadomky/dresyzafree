-- Přidá sloupce pro čas a poznámku k událostem
-- Spusť v Supabase Dashboard -> SQL Editor
-- (Nebo použij /api/admin/migrate-event-note?key=migrate-event-note-2024 s SUPABASE_ACCESS_TOKEN)

DROP TABLE IF EXISTS note CASCADE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS note TEXT;
