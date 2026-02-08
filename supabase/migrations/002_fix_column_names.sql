-- Oprava názvů sloupců na camelCase s uvozovkami
-- Tento skript přejmenuje sloupce na správné názvy s camelCase

-- Pokud tabulka ještě neexistuje, vytvoř ji s správnými názvy
-- Pokud existuje, přejmenuj sloupce

DO $$
BEGIN
  -- Kontrola a přejmenování sloupců, pokud existují
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'teamname') THEN
    ALTER TABLE teams RENAME COLUMN teamname TO "teamName";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'contactperson') THEN
    ALTER TABLE teams RENAME COLUMN contactperson TO "contactPerson";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'createdat') THEN
    ALTER TABLE teams RENAME COLUMN createdat TO "createdAt";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'referrerid') THEN
    ALTER TABLE teams RENAME COLUMN referrerid TO "referrerId";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'numberofjerseys') THEN
    ALTER TABLE teams RENAME COLUMN numberofjerseys TO "numberOfJerseys";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'numberoftariffs') THEN
    ALTER TABLE teams RENAME COLUMN numberoftariffs TO "numberOfTariffs";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'tariffvaliduntil') THEN
    ALTER TABLE teams RENAME COLUMN tariffvaliduntil TO "tariffValidUntil";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'jerseyurl') THEN
    ALTER TABLE teams RENAME COLUMN jerseyurl TO "jerseyUrl";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'shortsurl') THEN
    ALTER TABLE teams RENAME COLUMN shortsurl TO "shortsUrl";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'socksurl') THEN
    ALTER TABLE teams RENAME COLUMN socksurl TO "socksUrl";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'deliveryaddress') THEN
    ALTER TABLE teams RENAME COLUMN deliveryaddress TO "deliveryAddress";
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'meetingnote') THEN
    ALTER TABLE teams RENAME COLUMN meetingnote TO "meetingNote";
  END IF;
END $$;

-- Obnovení indexů s správnými názvy sloupců
DROP INDEX IF EXISTS idx_teams_referrerId;
DROP INDEX IF EXISTS idx_teams_createdAt;
CREATE INDEX IF NOT EXISTS idx_teams_referrerId ON teams("referrerId");
CREATE INDEX IF NOT EXISTS idx_teams_createdAt ON teams("createdAt");

