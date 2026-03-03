-- Supabase schema sync for production (idempotent)
-- Safe to run repeatedly. No destructive operations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- teams + admin
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

CREATE TABLE IF NOT EXISTS admin (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for teams" ON teams;
CREATE POLICY "Allow all for teams" ON teams FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for admin" ON admin;
CREATE POLICY "Allow all for admin" ON admin FOR ALL USING (true) WITH CHECK (true);

-- players
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);

-- matches
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

-- ratings
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

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for players" ON players;
CREATE POLICY "Allow all for players" ON players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for matches" ON matches;
CREATE POLICY "Allow all for matches" ON matches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for ratings" ON ratings;
CREATE POLICY "Allow all for ratings" ON ratings FOR ALL USING (true) WITH CHECK (true);

-- events + attendance
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

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for events" ON events;
CREATE POLICY "Allow all for events" ON events FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for event_attendance" ON event_attendance;
CREATE POLICY "Allow all for event_attendance" ON event_attendance FOR ALL USING (true) WITH CHECK (true);

-- match scorers + assists
CREATE TABLE IF NOT EXISTS match_goal_scorers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  goal_order INTEGER NOT NULL CHECK (goal_order >= 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, goal_order)
);

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

-- additive columns required by app
ALTER TABLE teams ADD COLUMN IF NOT EXISTS coach_player_id TEXT REFERENCES players(id) ON DELETE SET NULL;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS overview_layout JSONB;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS background_color TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS jerseytype TEXT;

ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE matches ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS goals_for INTEGER;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS goals_against INTEGER;

ALTER TABLE events ADD COLUMN IF NOT EXISTS start_time TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS share_token TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS attendance_finalized_at TIMESTAMPTZ;

ALTER TABLE event_attendance ADD COLUMN IF NOT EXISTS absence_reason TEXT;

-- normalize existing events without token
UPDATE events
SET share_token = gen_random_uuid()::text
WHERE share_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_share_token
ON events(share_token)
WHERE share_token IS NOT NULL;

-- ensure rating range allows 0..10
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_percentage_check;
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_score_check;
ALTER TABLE ratings ADD CONSTRAINT ratings_score_check
  CHECK (percentage >= 0 AND percentage <= 10);

-- scored_at: timestamp when the score was last recorded
ALTER TABLE matches ADD COLUMN IF NOT EXISTS scored_at TIMESTAMPTZ;

-- Backfill: for existing matches that already have a score, set scored_at to created_at
UPDATE matches
SET scored_at = created_at
WHERE scored_at IS NULL
  AND goals_for IS NOT NULL
  AND goals_against IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_matches_scored_at
ON matches(team_id, scored_at DESC NULLS LAST);

-- fan_votes: public fan voting for player of the match
CREATE TABLE IF NOT EXISTS fan_votes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  voter_identifier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, voter_identifier)
);

CREATE INDEX IF NOT EXISTS idx_fan_votes_match ON fan_votes(match_id);
CREATE INDEX IF NOT EXISTS idx_fan_votes_player ON fan_votes(player_id);

ALTER TABLE fan_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for fan_votes" ON fan_votes;
CREATE POLICY "Allow all for fan_votes" ON fan_votes FOR ALL USING (true) WITH CHECK (true);

-- match cards (yellow / red)
CREATE TABLE IF NOT EXISTS match_cards (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL CHECK (card_type IN ('yellow', 'red')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_cards_match ON match_cards(match_id);

ALTER TABLE match_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for match_cards" ON match_cards;
CREATE POLICY "Allow all for match_cards" ON match_cards FOR ALL USING (true) WITH CHECK (true);
