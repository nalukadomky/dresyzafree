-- Feedback widget — sběr zpětné vazby od týmů
CREATE TABLE IF NOT EXISTS feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id TEXT NOT NULL,
  feature_request TEXT,
  emoji_rating SMALLINT CHECK (emoji_rating >= 1 AND emoji_rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_team_id ON feedback(team_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON feedback
  FOR ALL
  USING (true)
  WITH CHECK (true);
