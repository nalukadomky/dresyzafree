-- Přidání sloupce voting_deadline do tabulky events
-- Umožňuje nastavit vlastní deadline pro uzavření hlasování hráčů
-- Pokud je NULL, použije se výchozí logika (den před událostí o půlnoci)

ALTER TABLE events ADD COLUMN IF NOT EXISTS voting_deadline TIMESTAMPTZ;
