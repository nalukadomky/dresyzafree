-- Migrace: změna hodnocení z procent (0-100) na škálu 1-10
-- Spusť v Supabase SQL Editor (pro existující databáze)

ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_percentage_check;
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_score_check;

ALTER TABLE ratings ADD CONSTRAINT ratings_score_check 
  CHECK (percentage >= 1 AND percentage <= 10);
