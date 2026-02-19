-- Přidá sloupec pro trenéra týmu (hráč s 30 % větším vlivem na hodnocení)
-- Trenér je jeden z hráčů týmu – spusť v Supabase Dashboard → SQL Editor

ALTER TABLE teams ADD COLUMN IF NOT EXISTS coach_player_id TEXT REFERENCES players(id) ON DELETE SET NULL;
