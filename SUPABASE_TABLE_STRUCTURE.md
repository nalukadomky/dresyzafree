# Struktura tabulky `teams` v Supabase

## 📋 Kompletní seznam sloupců

### Základní identifikace
- **id** (TEXT, PRIMARY KEY) - Unikátní ID týmu
- **createdAt** (TIMESTAMPTZ) - Datum a čas vytvoření záznamu

### Údaje z registrace (povinné)
- **teamName** (TEXT, NOT NULL) - Název týmu
- **contactPerson** (TEXT, NOT NULL) - Kontaktní osoba
- **phone** (TEXT, NOT NULL) - Telefonní číslo
- **email** (TEXT, NOT NULL) - E-mailová adresa
- **leagues** (JSONB, NOT NULL) - Sledované ligy (pole)
- **username** (TEXT, UNIQUE, NOT NULL) - Přihlašovací jméno
- **password** (TEXT, NOT NULL) - Hash hesla (bcrypt)

### Volitelné údaje z registrace
- **logo** (TEXT) - Cesta k logu týmu
- **referrerId** (TEXT) - ID týmu, který doporučil

### Admin nastavení (doplňují se později)
- **status** (TEXT) - Stav: 'nekontaktováno', 'kontaktováno', 'nemá zájem', 'deal'
- **numberOfJerseys** (INTEGER) - Počet dresů
- **numberOfTariffs** (INTEGER) - Počet tarifů
- **deadline** (TIMESTAMPTZ) - Termín dodání dresů
- **tariffValidUntil** (TIMESTAMPTZ) - Platnost tarifů do

### Odkazy na dresy
- **jerseyUrl** (TEXT) - URL odkazu na dres
- **shortsUrl** (TEXT) - URL odkazu na trenýrky
- **socksUrl** (TEXT) - URL odkazu na štrupny

### Další údaje
- **deliveryAddress** (TEXT) - Adresa dodání dresů
- **ico** (TEXT) - IČO osoby/týmu
- **meetingNote** (TEXT) - Poznámka z jednání

## 🔍 Indexy pro rychlé vyhledávání
- `idx_teams_username` - na sloupec `username`
- `idx_teams_referrerId` - na sloupec `referrerId`
- `idx_teams_status` - na sloupec `status`
- `idx_teams_createdAt` - na sloupec `createdAt`
- `idx_teams_email` - na sloupec `email`
- `idx_teams_phone` - na sloupec `phone`

## 📍 Kde najdete data v Supabase

1. **Supabase Dashboard**: https://app.supabase.com/project/hcmeehplfkywifolcgio
2. **Table Editor** → `teams` - zde uvidíte všechny týmy
3. **SQL Editor** - můžete spouštět dotazy

## ✅ Co se ukládá při registraci

Při registraci se ukládají tyto údaje:
- ✅ Název týmu (teamName)
- ✅ Kontaktní osoba (contactPerson)
- ✅ Telefon (phone)
- ✅ E-mail (email)
- ✅ Sledované ligy (leagues)
- ✅ Přihlašovací jméno (username)
- ✅ Hash hesla (password)
- ✅ Logo (logo) - pokud je nahráno
- ✅ ID doporučujícího týmu (referrerId) - pokud je zadáno
- ✅ Status (status) - automaticky nastaven na 'nekontaktováno'
- ✅ Datum vytvoření (createdAt) - automaticky

## 🔧 Jak spustit migraci

1. Otevřete Supabase SQL Editor: https://app.supabase.com/project/hcmeehplfkywifolcgio/sql/new
2. Zkopírujte celý obsah z `supabase/migrations/003_recreate_tables.sql`
3. Spusťte SQL příkaz (Ctrl+Enter nebo tlačítko Run)
4. Po úspěšném spuštění spusťte migraci dat: `npx tsx scripts/migrate-to-supabase.ts`

