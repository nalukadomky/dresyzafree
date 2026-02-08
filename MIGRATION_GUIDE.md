# Průvodce migrací na Supabase

Tento průvodce vás provede migrací z file-based JSON databáze na Supabase (PostgreSQL).

## Krok 1: Instalace závislostí

```bash
npm install
```

Tím se nainstaluje `@supabase/supabase-js`.

## Krok 2: Vytvoření Supabase projektu

1. Jděte na https://supabase.com a vytvořte účet
2. Vytvořte nový projekt
3. Počkejte, až se projekt inicializuje (trvá cca 2 minuty)

## Krok 3: Nastavení prostředí

1. V Supabase projektu jděte do **Settings → API**
2. Zkopírujte následující hodnoty:
   - **Project URL**
   - **anon public** key
   - **service_role** key (⚠️ DŮLEŽITÉ: Tento klíč je tajný, nikdy ho nesdílejte!)

3. Vytvořte soubor `.env.local` v kořenovém adresáři projektu:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Krok 4: Vytvoření databázových tabulek

1. V Supabase projektu jděte do **SQL Editor**
2. Otevřete soubor `supabase/migrations/001_initial_schema.sql`
3. Zkopírujte celý obsah a vložte do SQL Editoru
4. Klikněte na **Run** pro spuštění migrace

Tím se vytvoří tabulky `teams` a `admin` s potřebnými indexy.

## Krok 5: Migrace existujících dat

Spusťte migrační skript pro přenesení dat z JSON souborů do Supabase:

```bash
npx tsx scripts/migrate-to-supabase.ts
```

Skript:
- Načte všechna data z `data/teams.json` a `data/admin.json`
- Vloží je do Supabase databáze
- Přeskočí záznamy, které už v databázi existují

## Krok 6: Ověření migrace

1. V Supabase projektu jděte do **Table Editor**
2. Měli byste vidět tabulky `teams` a `admin`
3. Zkontrolujte, že data byla správně migrována

## Krok 7: Testování aplikace

1. Spusťte vývojový server: `npm run dev`
2. Otestujte registraci nového týmu
3. Otestujte přihlášení
4. Zkontrolujte, že data se ukládají do Supabase (v Table Editoru)

## Fallback mechanismus

Aplikace má vestavěný fallback mechanismus:
- Pokud Supabase není nakonfigurován (chybí `.env.local`), použije se file-based JSON databáze
- Pokud dojde k chybě při komunikaci se Supabase, automaticky se přepne na file-based DB
- To zajišťuje, že aplikace bude fungovat i bez databáze

## Řešení problémů

### Chyba: "Supabase credentials not found"
- Zkontrolujte, že `.env.local` existuje a obsahuje správné hodnoty
- Restartujte vývojový server po změně `.env.local`

### Chyba při migraci dat
- Zkontrolujte, že SQL migrace proběhla úspěšně
- Ověřte, že `SUPABASE_SERVICE_ROLE_KEY` je správný
- Zkontrolujte konzoli pro detailní chybové hlášky

### Data se neukládají do Supabase
- Ověřte, že `.env.local` obsahuje správné hodnoty
- Zkontrolujte Network tab v DevTools pro chyby API
- Podívejte se do Supabase Logs pro detailní chyby

## Další kroky

Po úspěšné migraci můžete:
- Smazat složku `data/` (volitelné, ale doporučeno)
- Nastavit Row Level Security (RLS) v Supabase pro lepší bezpečnost
- Vytvořit backup strategii pro databázi

