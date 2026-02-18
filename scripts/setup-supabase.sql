-- Spusť v Supabase Dashboard -> SQL Editor
-- Přidá sloupec jerseytype do tabulky teams (pokud chybí)

ALTER TABLE teams ADD COLUMN IF NOT EXISTS jerseytype TEXT;

-- Storage bucket "team-logos" se vytvoří automaticky při prvním uploadu.
-- Pokud chceš bucket vytvořit ručně: Storage -> New bucket -> "team-logos" (public)
