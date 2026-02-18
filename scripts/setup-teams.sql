-- Spusť v Supabase Dashboard -> SQL Editor
-- Vytvoří tabulky teams a admin

-- Tabulka týmů
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  teamname TEXT NOT NULL,
  contactperson TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  leagues TEXT[] NOT NULL DEFAULT '{}',
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logo TEXT,
  referrerid TEXT REFERENCES teams(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('nekontaktováno', 'kontaktováno', 'nemá zájem', 'deal')),
  numberofjerseys INTEGER,
  numberoftariffs INTEGER,
  deadline TEXT,
  tariffvaliduntil TEXT,
  jerseyurl TEXT,
  shortsurl TEXT,
  socksurl TEXT,
  deliveryaddress TEXT,
  ico TEXT,
  meetingnote TEXT,
  jerseytype TEXT,
  background_color TEXT
);

CREATE INDEX IF NOT EXISTS idx_teams_username ON teams(username);
CREATE INDEX IF NOT EXISTS idx_teams_email ON teams(email);

-- Tabulka admin (pro přihlášení administrátora)
CREATE TABLE IF NOT EXISTS admin (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL
);

-- RLS - povolit přístup (API ověřuje JWT)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for teams" ON teams;
CREATE POLICY "Allow all for teams" ON teams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for admin" ON admin;
CREATE POLICY "Allow all for admin" ON admin FOR ALL USING (true) WITH CHECK (true);
