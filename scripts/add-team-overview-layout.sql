-- Přidá per-team konfiguraci pořadí/velikosti/viditelnosti boxů v přehledu
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS overview_layout JSONB;
