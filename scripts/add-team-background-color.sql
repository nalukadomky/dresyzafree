-- Přidá unikátní barvu pozadí pro tým
-- Spusť v Supabase Dashboard -> SQL Editor

ALTER TABLE teams ADD COLUMN IF NOT EXISTS background_color TEXT;
