# ✅ Supabase propojení - další kroky

## ✅ Co je hotovo:
- ✅ `.env.local` soubor vytvořen s credentials
- ✅ Supabase klient připraven (`lib/supabase.ts`)
- ✅ Async databázový wrapper připraven (`lib/db-supabase.ts`)
- ✅ Všechny API routes upraveny pro async databázi

## 📋 Co ještě potřebuješ udělat:

### Krok 1: Instalace závislostí (pokud ještě nejsou)

```bash
npm install
```

### Krok 2: Spuštění SQL migrace v Supabase

1. Otevři svůj Supabase projekt: https://app.supabase.com
2. Jdi do **SQL Editor** (v levém menu)
3. Klikni na **New query**
4. Otevři soubor `supabase/migrations/001_initial_schema.sql` z tohoto projektu
5. **Zkopíruj celý obsah** SQL souboru
6. **Vlož do SQL Editoru** v Supabase
7. Klikni na **Run** (nebo stiskni Ctrl+Enter / Cmd+Enter)

Tím se vytvoří:
- Tabulka `teams` pro týmy
- Tabulka `admin` pro administrátory
- Indexy pro lepší výkon
- Defaultní admin účet

### Krok 3: Migrace existujících dat (volitelné)

Pokud máš data v `data/teams.json`, můžeš je migrovat:

```bash
npx tsx scripts/migrate-to-supabase.ts
```

### Krok 4: Restart serveru

```bash
npm run dev
```

### Krok 5: Ověření

1. Zkus se zaregistrovat jako nový tým
2. V Supabase → **Table Editor** bys měl vidět nový tým v tabulce `teams`
3. Zkus se přihlásit

## 🔍 Jak ověřit, že to funguje:

1. **V Supabase Table Editor:**
   - Měly by se zobrazit tabulky `teams` a `admin`
   - Po registraci by se měl objevit nový řádek v `teams`

2. **V konzoli serveru:**
   - Neměly by se objevovat chyby o Supabase připojení
   - Pokud se objeví "Supabase credentials not found", zkontroluj `.env.local`

3. **V aplikaci:**
   - Registrace by měla fungovat
   - Přihlášení by mělo fungovat
   - Data by se měla ukládat do Supabase

## ⚠️ Troubleshooting:

### Chyba: "Supabase credentials not found"
- Zkontroluj, že `.env.local` existuje a obsahuje všechny 3 hodnoty
- Restartuj server po změně `.env.local`

### Chyba při SQL migraci
- Zkontroluj, že kopíruješ celý obsah SQL souboru
- Ověř, že tabulky ještě neexistují (nebo použij `DROP TABLE IF EXISTS`)

### Data se neukládají do Supabase
- Ověř, že SQL migrace proběhla úspěšně
- Zkontroluj Network tab v DevTools pro chyby API
- Podívej se do Supabase Logs

---

**Vše je připraveno! Stačí spustit SQL migraci a restartovat server.** 🚀

