# Nastavení prostředí pro Supabase

Vytvořte soubor `.env.local` v kořenovém adresáři projektu s následujícím obsahem:

```env
# Supabase Configuration
# Získejte tyto hodnoty z https://app.supabase.com/project/_/settings/api

# Project URL
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here

# Anon/Public Key (pro klienta)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Service Role Key (pouze pro migrační skripty, NIKDY necommitovat!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Jak získat Supabase credentials:

1. Vytvořte účet na https://supabase.com
2. Vytvořte nový projekt
3. Jděte do Settings → API
4. Zkopírujte:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (pouze pro migraci)

## Spuštění migrace:

1. Spusťte SQL migraci v Supabase SQL Editor (soubor `supabase/migrations/001_initial_schema.sql`)
2. Spusťte migrační skript: `npx tsx scripts/migrate-to-supabase.ts`

