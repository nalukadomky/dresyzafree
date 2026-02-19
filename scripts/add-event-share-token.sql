-- Odkaz pro sdílení účasti + důvod nepřítomnosti
-- Spusť v Supabase Dashboard → SQL Editor

-- Jedinečný token pro veřejný odkaz k události
ALTER TABLE events ADD COLUMN IF NOT EXISTS share_token TEXT;

-- Důvod nepřítomnosti (povinný při neúčasti)
ALTER TABLE event_attendance ADD COLUMN IF NOT EXISTS absence_reason TEXT;

-- Generování tokenů pro existující události bez tokenu
UPDATE events
SET share_token = gen_random_uuid()::text
WHERE share_token IS NULL;

-- Jedinečnost tokenů (pro nové události generuje aplikace)
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_share_token ON events(share_token) WHERE share_token IS NOT NULL;
