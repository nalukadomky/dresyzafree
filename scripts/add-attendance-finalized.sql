-- Docházka: po odeslání nelze měnit. Spusť v Supabase SQL Editor.
ALTER TABLE events ADD COLUMN IF NOT EXISTS attendance_finalized_at TIMESTAMPTZ;
