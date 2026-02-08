# 🚀 Instrukce pro migraci do Supabase

## ⚠️ Důležité

Automatická migrace SQL není možná, protože Supabase API nepodporuje DDL příkazy (CREATE TABLE, CREATE INDEX). Musíš to udělat ručně, ale je to velmi jednoduché!

## 📋 Krok 1: Spuštění SQL migrace (vytvoření tabulek)

1. **Otevři SQL Editor v Supabase:**
   - https://app.supabase.com/project/hcmeehplfkywifolcgio/sql/new
   - Nebo: Supabase Dashboard → SQL Editor → New query

2. **Zkopíruj SQL migraci:**
   - Otevři soubor: `supabase/migrations/001_initial_schema.sql`
   - Zkopíruj celý obsah (Ctrl+A, Ctrl+C)

3. **Vlož a spusť:**
   - Vlož SQL do editoru
   - Klikni **Run** (nebo Ctrl+Enter / Cmd+Enter)

4. **Ověř:**
   - V Supabase → **Table Editor** bys měl vidět tabulky `teams` a `admin`

## 📦 Krok 2: Migrace existujících dat

Po spuštění SQL migrace spusť:

```bash
npx tsx scripts/migrate-to-supabase.ts
```

Tím se migruje 5 týmů z `data/teams.json` do Supabase.

## ✅ Krok 3: Restart serveru

```bash
npm run dev
```

## 🎉 Hotovo!

Po těchto krocích:
- ✅ Tabulky jsou vytvořené v Supabase
- ✅ Existující data jsou migrována
- ✅ Nová data se budou ukládat do Supabase automaticky

---

**Poznámka:** Pokud nechceš migrovat existující data, můžeš je nechat v JSON souborech. Nová data se budou ukládat do Supabase automaticky po spuštění SQL migrace.

