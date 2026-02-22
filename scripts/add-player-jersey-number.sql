-- Přidá číslo dresu do tabulky players (pro existující instalace)
ALTER TABLE players
  ADD COLUMN IF NOT EXISTS jersey_number INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'players_jersey_number_check'
  ) THEN
    ALTER TABLE players
      ADD CONSTRAINT players_jersey_number_check
      CHECK (jersey_number IS NULL OR (jersey_number BETWEEN 1 AND 99));
  END IF;
END $$;
