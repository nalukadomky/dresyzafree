-- Přidá přesný čas začátku tréninku a zápasu
-- Spusť v Supabase Dashboard -> SQL Editor (pro existující databáze)
-- Pro nové instalace je start_time už v setup-training-attendance.sql a setup-player-voting.sql

ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS start_time TEXT;
