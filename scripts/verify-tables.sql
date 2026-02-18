-- Ověření existence tabulek – spusť v Supabase SQL Editor
-- Měly by se zobrazit: players, matches, ratings (v public schema)

SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('teams', 'players', 'matches', 'ratings')
ORDER BY table_name;
