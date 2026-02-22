-- Migration: Website builder rozšíření + Players columns
-- Spustit v Supabase SQL Editor (https://supabase.com/dashboard/project/hcmeehplfkywifolcgio/sql)
-- Datum: 2026-02-21

-- ============================================================
-- 1. Základní setup team_websites (IF NOT EXISTS = bezpečné)
-- ============================================================

ALTER TABLE teams ADD COLUMN IF NOT EXISTS website_slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_teams_website_slug ON teams(website_slug);

CREATE TABLE IF NOT EXISTS team_websites (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  published BOOLEAN NOT NULL DEFAULT false,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E293B',
  section_order TEXT[] DEFAULT ARRAY['hero','team','events','contact'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_websites_team_id ON team_websites(team_id);

ALTER TABLE team_websites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for team_websites" ON team_websites;
CREATE POLICY "Allow all for team_websites" ON team_websites FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 2. Tabulka team_website_sections s rozšířeným CHECK constraint
-- ============================================================

CREATE TABLE IF NOT EXISTS team_website_sections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, section_type)
);

CREATE INDEX IF NOT EXISTS idx_team_website_sections_team_id ON team_website_sections(team_id);

ALTER TABLE team_website_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for team_website_sections" ON team_website_sections;
CREATE POLICY "Allow all for team_website_sections" ON team_website_sections FOR ALL USING (true) WITH CHECK (true);

-- Drop starý constraint (pokud existuje) a přidej nový s rozšířenými typy
ALTER TABLE team_website_sections DROP CONSTRAINT IF EXISTS team_website_sections_section_type_check;
ALTER TABLE team_website_sections ADD CONSTRAINT team_website_sections_section_type_check
  CHECK (section_type IN ('hero', 'team', 'events', 'contact', 'about', 'gallery', 'textblock'));

-- ============================================================
-- 3. Players: nové sloupce
-- ============================================================

ALTER TABLE players ADD COLUMN IF NOT EXISTS jersey_number INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ============================================================
-- 4. Notify PostgREST to reload schema cache
-- ============================================================

NOTIFY pgrst, 'reload schema';
