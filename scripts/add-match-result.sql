-- Přidá sloupce pro výsledek zápasu (pro existující databáze)
-- Spusť v Supabase SQL Editor

ALTER TABLE matches ADD COLUMN IF NOT EXISTS result TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS goals_for INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS goals_against INTEGER;
