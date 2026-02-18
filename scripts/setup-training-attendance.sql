-- Spusť v Supabase Dashboard -> SQL Editor
-- Vytvoří tabulky pro přehled tréninků a účasti hráčů

-- Události (tréninky, zápasy přátelské, mistrovské)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('training', 'friendly_match', 'competitive_match')),
  location TEXT,
  opponent TEXT,
  start_time TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_team_id ON events(team_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);

-- Účast hráčů na události
CREATE TABLE IF NOT EXISTS event_attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  attended BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_event_attendance_event ON event_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_event_attendance_player ON event_attendance(player_id);

-- RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for events" ON events;
CREATE POLICY "Allow all for events" ON events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for event_attendance" ON event_attendance;
CREATE POLICY "Allow all for event_attendance" ON event_attendance FOR ALL USING (true) WITH CHECK (true);
