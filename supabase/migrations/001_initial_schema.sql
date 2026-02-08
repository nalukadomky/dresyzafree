-- Vytvoření tabulky teams
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  "teamName" TEXT NOT NULL,
  "contactPerson" TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  leagues JSONB NOT NULL DEFAULT '[]',
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logo TEXT,
  "referrerId" TEXT,
  status TEXT CHECK (status IN ('nekontaktováno', 'kontaktováno', 'nemá zájem', 'deal')) DEFAULT 'nekontaktováno',
  "numberOfJerseys" INTEGER,
  "numberOfTariffs" INTEGER,
  deadline TIMESTAMPTZ,
  "tariffValidUntil" TIMESTAMPTZ,
  "jerseyUrl" TEXT,
  "shortsUrl" TEXT,
  "socksUrl" TEXT,
  "deliveryAddress" TEXT,
  ico TEXT,
  "meetingNote" TEXT
);

-- Vytvoření tabulky admin
CREATE TABLE IF NOT EXISTS admin (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL
);

-- Vytvoření indexů pro lepší výkon
CREATE INDEX IF NOT EXISTS idx_teams_username ON teams(username);
CREATE INDEX IF NOT EXISTS idx_teams_referrerId ON teams("referrerId");
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_createdAt ON teams("createdAt");

-- Vložení defaultního admin účtu
INSERT INTO admin (username, password)
VALUES ('lasak.design@gmail.com', '$2a$10$gzOTWOCom0l8enLku2H7POu2l2JPVkI/2MbwA66ZRP281oSzcSwKC')
ON CONFLICT (username) DO NOTHING;

