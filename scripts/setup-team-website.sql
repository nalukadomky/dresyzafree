-- Týmový web: tabulky pro website builder
-- Spustit v Supabase SQL editoru

-- 1. Přidat sloupec website_slug na teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS website_slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_teams_website_slug ON teams(website_slug);

-- 2. Hlavní tabulka pro konfiguraci webu
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

-- 3. Sekce webu (hero, team, events, contact)
CREATE TABLE IF NOT EXISTS team_website_sections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('hero', 'team', 'events', 'contact')),
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, section_type)
);

CREATE INDEX IF NOT EXISTS idx_team_website_sections_team_id ON team_website_sections(team_id);

ALTER TABLE team_website_sections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for team_website_sections" ON team_website_sections;
CREATE POLICY "Allow all for team_website_sections" ON team_website_sections FOR ALL USING (true) WITH CHECK (true);
