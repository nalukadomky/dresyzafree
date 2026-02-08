# ✅ Status migrace na Supabase

## ✅ Co je hotovo:

- ✅ `.env.local` vytvořen s credentials
- ✅ Supabase klient připraven (`lib/supabase.ts`)
- ✅ Async databázový wrapper připraven (`lib/db-supabase.ts`)
- ✅ Všechny API routes upraveny pro async databázi
- ✅ SQL migrační skript připraven (`supabase/migrations/001_initial_schema.sql`)

## ⚠️ Co ještě potřebuješ udělat:

### SQL migrace musí být spuštěna ručně

Supabase API nepodporuje DDL příkazy (CREATE TABLE, CREATE INDEX) automaticky. Musíš to udělat ručně:

### Rychlý způsob:

1. **Otevři SQL Editor:**
   - https://app.supabase.com/project/hcmeehplfkywifolcgio/sql/new
   - Nebo otevři soubor `open-sql-editor.html` v prohlížeči

2. **Zkopíruj SQL migraci:**
   - Otevři soubor: `supabase/migrations/001_initial_schema.sql`
   - Zkopíruj celý obsah (Ctrl+A, Ctrl+C)

3. **Vlož do SQL Editoru:**
   - Vlož zkopírovaný SQL do editoru
   - Klikni **Run** (nebo Ctrl+Enter / Cmd+Enter)

4. **Ověř:**
   - V Supabase → **Table Editor** bys měl vidět tabulky `teams` a `admin`

### Po spuštění migrace:

1. Restartuj server: `npm run dev`
2. Zkus se zaregistrovat
3. Zkontroluj v Supabase Table Editoru, že se data ukládají

---

**Poznámka:** Aplikace má fallback mechanismus - pokud Supabase není nakonfigurován nebo migrace není spuštěna, použije se file-based JSON databáze. Po spuštění SQL migrace se automaticky přepne na Supabase.

