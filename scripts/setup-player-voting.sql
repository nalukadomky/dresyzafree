-- Spusť v Supabase Dashboard -> SQL Editor
-- Vytvoří tabulky pro hodnocení hráčů

-- Hráči týmu (spusťte až po vytvoření tabulky teams)
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);

-- Zápasy
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  opponent TEXT,
  name TEXT,
  result TEXT,
  goals_for INTEGER,
  goals_against INTEGER,
  start_time TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_team_id ON matches(team_id);

-- Hodnocení (hráč A hodnotí hráče B v zápase - škála 0-10, 0 = nebyl nasazen, 10 = nejlepší)
-- voter != rated (nelze hodnotit sám sebe)
CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  voter_player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rated_player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  percentage INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_rating CHECK (voter_player_id != rated_player_id),
  UNIQUE(match_id, voter_player_id, rated_player_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_match ON ratings(match_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated ON ratings(rated_player_id);

-- Povolit zápis přes anon klíč (API ověřuje JWT)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for players" ON players;
CREATE POLICY "Allow all for players" ON players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for matches" ON matches;
CREATE POLICY "Allow all for matches" ON matches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for ratings" ON ratings;
CREATE POLICY "Allow all for ratings" ON ratings FOR ALL USING (true) WITH CHECK (true);
