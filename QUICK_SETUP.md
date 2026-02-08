# ⚡ Rychlé nastavení Supabase

## Krok 1: Získání credentials

1. Otevři svůj Supabase projekt: https://app.supabase.com
2. Jdi do **Settings** (⚙️) → **API**
3. Zkopíruj tyto 3 hodnoty:
   - **Project URL** (např. `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key

## Krok 2: Vytvoření .env.local

Vytvoř soubor `.env.local` v kořenovém adresáři projektu:

```env
NEXT_PUBLIC_SUPABASE_URL=zde-vlož-Project-URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=zde-vlož-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=zde-vlož-service-role-key
```

## Krok 3: Spuštění SQL migrace

1. V Supabase → **SQL Editor**
2. Otevři soubor: `supabase/migrations/001_initial_schema.sql`
3. Zkopíruj celý obsah a vlož do SQL Editoru
4. Klikni **Run** (nebo Ctrl+Enter)

## Krok 4: Restart serveru

```bash
npm run dev
```

## Krok 5: Ověření

1. Zkus se zaregistrovat
2. V Supabase → **Table Editor** bys měl vidět nový tým

---

**Alternativně:** Pošli mi credentials a já ti to nastavím! 📧

