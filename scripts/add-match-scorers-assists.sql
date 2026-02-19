-- Střelci branek a asistence našeho týmu
-- Spusť v Supabase Dashboard -> SQL Editor

-- Střelci branek (pořadí = 1. branka, 2. branka, …)
CREATE TABLE IF NOT EXISTS match_goal_scorers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  goal_order INTEGER NOT NULL CHECK (goal_order >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, goal_order)
);

-- Asistence (pořadí = asistence k 1. brance, 2. brance, …)
CREATE TABLE IF NOT EXISTS match_assists (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  assist_order INTEGER NOT NULL CHECK (assist_order >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, assist_order)
);

CREATE INDEX IF NOT EXISTS idx_match_goal_scorers_match ON match_goal_scorers(match_id);
CREATE INDEX IF NOT EXISTS idx_match_assists_match ON match_assists(match_id);

ALTER TABLE match_goal_scorers ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_assists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for match_goal_scorers" ON match_goal_scorers;
CREATE POLICY "Allow all for match_goal_scorers" ON match_goal_scorers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for match_assists" ON match_assists;
CREATE POLICY "Allow all for match_assists" ON match_assists FOR ALL USING (true) WITH CHECK (true);
