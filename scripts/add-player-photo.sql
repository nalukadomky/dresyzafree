-- Přidá sloupec pro fotku hráče
-- Spusť v Supabase Dashboard -> SQL Editor

ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url TEXT;
