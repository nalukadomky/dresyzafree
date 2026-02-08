# 🚀 Rychlé propojení s Supabase

Máš už připravený Supabase projekt? Skvělé! Tady je rychlý návod, jak ho propojit:

## 📋 Co potřebuješ z Supabase:

1. **Project URL** - najdeš v Settings → API
2. **anon public key** - najdeš v Settings → API  
3. **service_role key** - najdeš v Settings → API (⚠️ TAJNÝ!)

## 🔧 Nastavení:

### Varianta 1: Ruční vytvoření .env.local

Vytvoř soubor `.env.local` v kořenovém adresáři projektu:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tvuj-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Varianta 2: Pošli mi credentials

Můžeš mi poslat:
- Project URL
- anon public key
- service_role key

A já ti pomůžu je nastavit.

## 📊 Spuštění SQL migrace:

1. V Supabase projektu → **SQL Editor**
2. Otevři soubor `supabase/migrations/001_initial_schema.sql`
3. Zkopíruj obsah a vlož do SQL Editoru
4. Klikni **Run**

## ✅ Ověření:

1. Restartuj server: `npm run dev`
2. Zkus se zaregistrovat
3. V Supabase → **Table Editor** bys měl vidět nový tým

---

**Poznámka:** Pokud nechceš nastavovat credentials ručně, můžeš mi je poslat a já ti pomůžu!

