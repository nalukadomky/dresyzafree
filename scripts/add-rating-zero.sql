-- Přidá možnost 0 u hodnocení (0 = nebyl nasazený)
-- Spusť v Supabase Dashboard -> SQL Editor

ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_percentage_check;
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_score_check;
ALTER TABLE ratings ADD CONSTRAINT ratings_score_check 
  CHECK (percentage >= 0 AND percentage <= 10);
