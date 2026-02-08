-- ============================================
-- KOMPLEXNÍ TABULKA TEAMS - VŠECHNY ÚDAJE
-- ============================================
-- Smazání a znovuvytvoření tabulek s správnými názvy sloupců
-- POZOR: Toto smaže všechna existující data!

DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS admin CASCADE;

-- Vytvoření komplexní tabulky teams s camelCase názvy v uvozovkách
-- Obsahuje všechny údaje z registrace + admin nastavení
CREATE TABLE teams (
  -- Základní identifikace
  id TEXT PRIMARY KEY,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Údaje z registrace (povinné)
  "teamName" TEXT NOT NULL,                    -- Název týmu
  "contactPerson" TEXT NOT NULL,                -- Kontaktní osoba
  phone TEXT NOT NULL,                          -- Telefonní číslo
  email TEXT NOT NULL,                          -- E-mailová adresa
  leagues JSONB NOT NULL DEFAULT '[]',          -- Sledované ligy (pole)
  username TEXT UNIQUE NOT NULL,                -- Přihlašovací jméno
  password TEXT NOT NULL,                       -- Hash hesla (bcrypt)
  
  -- Volitelné údaje z registrace
  logo TEXT,                                     -- Cesta k logu týmu
  "referrerId" TEXT,                            -- ID týmu, který doporučil
  
  -- Admin nastavení (doplňují se později)
  status TEXT CHECK (status IN ('nekontaktováno', 'kontaktováno', 'nemá zájem', 'deal')) DEFAULT 'nekontaktováno',
  "numberOfJerseys" INTEGER,                    -- Počet dresů
  "numberOfTariffs" INTEGER,                    -- Počet tarifů
  deadline TIMESTAMPTZ,                         -- Termín dodání dresů
  "tariffValidUntil" TIMESTAMPTZ,               -- Platnost tarifů do
  
  -- Odkazy na dresy
  "jerseyUrl" TEXT,                              -- URL odkazu na dres
  "shortsUrl" TEXT,                              -- URL odkazu na trenýrky
  "socksUrl" TEXT,                               -- URL odkazu na štrupny
  
  -- Další údaje
  "deliveryAddress" TEXT,                       -- Adresa dodání dresů
  ico TEXT,                                      -- IČO osoby/týmu
  "meetingNote" TEXT                            -- Poznámka z jednání
);

-- ============================================
-- TABULKA ADMIN
-- ============================================
CREATE TABLE admin (
  username TEXT PRIMARY KEY,
  password TEXT NOT NULL
);

-- ============================================
-- INDEXY PRO LEPŠÍ VÝKON
-- ============================================
CREATE INDEX idx_teams_username ON teams(username);
CREATE INDEX idx_teams_referrerId ON teams("referrerId");
CREATE INDEX idx_teams_status ON teams(status);
CREATE INDEX idx_teams_createdAt ON teams("createdAt");
CREATE INDEX idx_teams_email ON teams(email);
CREATE INDEX idx_teams_phone ON teams(phone);

-- ============================================
-- VLOŽENÍ DEFAULTNÍHO ADMIN ÚČTU
-- ============================================
INSERT INTO admin (username, password)
VALUES ('lasak.design@gmail.com', '$2a$10$gzOTWOCom0l8enLku2H7POu2l2JPVkI/2MbwA66ZRP281oSzcSwKC')
ON CONFLICT (username) DO NOTHING;

