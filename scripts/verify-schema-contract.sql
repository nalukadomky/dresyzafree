-- Verify required schema contract for this app.
-- Empty result sets in all sections = OK.

-- 1) Required tables
WITH required_tables(table_name) AS (
  VALUES
    ('teams'),
    ('admin'),
    ('players'),
    ('matches'),
    ('ratings'),
    ('events'),
    ('event_attendance'),
    ('match_goal_scorers'),
    ('match_assists')
)
SELECT rt.table_name AS missing_table
FROM required_tables rt
LEFT JOIN information_schema.tables t
  ON t.table_schema = 'public'
 AND t.table_name = rt.table_name
WHERE t.table_name IS NULL
ORDER BY rt.table_name;

-- 2) Required columns
WITH required_columns(table_name, column_name) AS (
  VALUES
    ('teams', 'background_color'),
    ('teams', 'coach_player_id'),
    ('teams', 'overview_layout'),
    ('teams', 'meetingnote'),
    ('teams', 'jerseytype'),
    ('players', 'photo_url'),
    ('matches', 'start_time'),
    ('matches', 'goals_for'),
    ('matches', 'goals_against'),
    ('events', 'start_time'),
    ('events', 'note'),
    ('events', 'share_token'),
    ('events', 'attendance_finalized_at'),
    ('event_attendance', 'absence_reason')
)
SELECT rc.table_name, rc.column_name AS missing_column
FROM required_columns rc
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = rc.table_name
 AND c.column_name = rc.column_name
WHERE c.column_name IS NULL
ORDER BY rc.table_name, rc.column_name;

-- 3) Required index for share token
SELECT 'idx_events_share_token' AS missing_index
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'events'
    AND indexname = 'idx_events_share_token'
);

-- 4) ratings percentage check constraint exists
SELECT 'ratings_score_check' AS missing_constraint
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_constraint pc
  JOIN pg_class rel ON rel.oid = pc.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'ratings'
    AND pc.conname = 'ratings_score_check'
);
