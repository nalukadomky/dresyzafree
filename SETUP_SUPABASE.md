# Nastavení Supabase propojení

## Krok 1: Získání credentials z Supabase

1. Otevři svůj Supabase projekt na https://app.supabase.com
2. Jdi do **Settings** (⚙️ ikona vlevo) → **API**
3. Zkopíruj následující hodnoty:

### Potřebné hodnoty:
- **Project URL** (např. `https://xxxxx.supabase.co`)
- **anon public** key (dlouhý řetězec začínající obvykle `eyJ...`)
- **service_role** key (dlouhý řetězec, ⚠️ TENTO JE TAJNÝ!)

## Krok 2: Vytvoření .env.local souboru

Vytvoř soubor `.env.local` v kořenovém adresáři projektu s tímto obsahem:

```env
NEXT_PUBLIC_SUPABASE_URL=zde-vlož-Project-URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=zde-vlož-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=zde-vlož-service-role-key
```

## Krok 3: Spuštění SQL migrace

1. V Supabase projektu jdi do **SQL Editor** (v levém menu)
2. Klikni na **New query**
3. Otevři soubor `supabase/migrations/001_initial_schema.sql` z tohoto projektu
4. Zkopíruj celý obsah a vlož do SQL Editoru
5. Klikni na **Run** (nebo Ctrl+Enter)

Tím se vytvoří tabulky `teams` a `admin`.

## Krok 4: Migrace existujících dat (volitelné)

Pokud máš data v `data/teams.json`, můžeš je migrovat:

```bash
npx tsx scripts/migrate-to-supabase.ts
```

## Krok 5: Ověření

1. Restartuj vývojový server (`npm run dev`)
2. Zkus se zaregistrovat nebo přihlásit
3. V Supabase jdi do **Table Editor** a zkontroluj, že se data ukládají

---

**Poznámka:** Pokud nechceš nastavovat .env.local ručně, můžeš mi poslat credentials a já ti pomůžu je nastavit.

