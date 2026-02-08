# 🔑 Kde najít Supabase Credentials

## Krok 1: Přihlášení do Supabase

1. Jdi na https://app.supabase.com
2. Přihlas se do svého účtu
3. Vyber svůj projekt (nebo vytvoř nový)

## Krok 2: Otevření API Settings

1. V levém menu klikni na **Settings** (⚙️ ikona)
2. V podmenu klikni na **API**

## Krok 3: Získání credentials

Na stránce API Settings uvidíš několik sekcí:

### 📍 Project URL
- Najdeš v sekci **Project URL**
- Vypadá takto: `https://xxxxxxxxxxxxx.supabase.co`
- **Zkopíruj celou URL**

### 🔑 API Keys

V sekci **API Keys** jsou 3 klíče:

#### 1. **anon public** key
- Najdeš v sekci **Project API keys**
- Řádek s názvem **anon** nebo **public**
- Je to dlouhý řetězec začínající obvykle `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Tento klíč je veřejný a bezpečný pro frontend**

#### 2. **service_role** key
- Najdeš ve stejné sekci **Project API keys**
- Řádek s názvem **service_role**
- Je to také dlouhý řetězec
- ⚠️ **POZOR: Tento klíč je TAJNÝ!** Má plný přístup k databázi
- **Nikdy ho nesdílej veřejně a necommituj do gitu**

#### 3. **project_ref** (nepotřebujeme)
- Tento nepotřebujeme

## 📋 Shrnutí - co potřebuješ zkopírovat:

1. **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
2. **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## 💡 Tipy:

- Všechny klíče můžeš zkopírovat kliknutím na ikonu kopírování vedle každého klíče
- Pokud nevidíš **service_role** key, můžeš ho zobrazit kliknutím na "Reveal" nebo "Show"
- Project URL najdeš také v URL adresě, když jsi v projektu

## 📝 Příklad .env.local:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

**Poznámka:** Pokud máš problém najít některý z klíčů, můžeš mi poslat screenshot nebo popsat, co vidíš na stránce API Settings.

