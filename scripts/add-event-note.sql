-- Přidá poznámku k události (trénink/zápas)
-- Spusť v Supabase Dashboard -> SQL Editor
--
-- Poznámka: Pokud jsi dříve vytvořil samostatnou tabulku "note", ta se odstraní.
-- Poznámka patří jako sloupec přímo do tabulky events, ne jako samostatná tabulka.

-- Odstranění chybně vytvořené tabulky note (pokud existuje)
DROP TABLE IF EXISTS note CASCADE;

-- Přidání sloupce note do tabulky events
ALTER TABLE events ADD COLUMN IF NOT EXISTS note TEXT;
