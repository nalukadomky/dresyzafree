# Přístupy pro Codex – Supabase a Vercel

Překopíruj níže do Codexu (nebo jako reference).

---

## 1. Proměnné prostředí – přehled

### Povinné (lokálně i na Vercelu)

| Proměnná | Kde vzít | Popis |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | URL projektu, např. `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → anon public | Veřejný klíč pro klienta |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role | Tajný klíč (jen server), nikdy na frontend |
| `JWT_SECRET` | Vytvoř si vlastní (min. 32 znaků) | Podpis JWT pro přihlášení týmů/admina |

### Volitelné (migrace, skripty)

| Proměnná | Kde vzít | Popis |
|----------|----------|--------|
| `SUPABASE_ACCESS_TOKEN` | supabase.com → Account → Access Tokens | Personal Access Token pro Management API (migrace) |
| `SUPABASE_DATABASE_URL` | Supabase → Settings → Database → Connection string | `postgresql://postgres:[HESLO]@db.xxx.supabase.co:5432/postgres` |
| `SUPABASE_DB_PASSWORD` | Heslo DB z Supabase | Pro skripty, které skládají connection string |
| `MIGRATE_SECRET` | Vlastní tajná hodnota | Ochrana endpointu `/api/admin/migrate-event-note?key=...` |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | Google Cloud Console → APIs & Services → Credentials | API klíč pro Maps, Places apod. |
| `GEMINI_IMAGE_API_KEY` | Google Cloud Console (stejný klíč; zapni Generative Language API + Imagen) | Generování obrázků přes Gemini / Imagen |
| `GOOGLE_AI_STUDIO_API_KEY` | Google AI Studio (aistudio.google.com) | API klíč pro Gemini (text) |

---

## 2. Blok pro .env.local (lokální vývoj)

```env
# Supabase – z dashboard.supabase.com → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://VAS_PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....

# JWT – silné náhodné heslo (min. 32 znaků)
JWT_SECRET=vytvorte-silne-nahodne-heslo-min-32-znaku

# Volitelně (migrace / skripty)
# SUPABASE_ACCESS_TOKEN=sbp_xxxx
# SUPABASE_DATABASE_URL=postgresql://postgres:HESLO@db.xxx.supabase.co:5432/postgres
# MIGRATE_SECRET=migrate-event-note-2024

# Google Cloud Console (Maps + Gemini Image Generation)
# NEXT_PUBLIC_GOOGLE_API_KEY=AIzaSy...
# GEMINI_IMAGE_API_KEY=AIzaSy...   (stejný klíč; pro generování obrázků)

# Google AI Studio (Gemini)
# GOOGLE_AI_STUDIO_API_KEY=AIzaSy...
```

---

## 3. Blok pro Vercel – Environment Variables

Do Vercel → Projekt → Settings → Environment Variables přidej (pro Production, Preview, Development podle potřeby):

```
NEXT_PUBLIC_SUPABASE_URL = https://VAS_PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ...
JWT_SECRET = (silné náhodné heslo, min. 32 znaků)
```

- **NEXT_PUBLIC_*** – budou vidět i v prohlížeči (pouze URL a anon key je v pořádku).
- **SUPABASE_SERVICE_ROLE_KEY** a **JWT_SECRET** nikdy nezaškrtávej jako „expose to browser“.

---

## 4. Supabase – odkazy a kroky

- **Dashboard:** https://supabase.com/dashboard  
- **Projekt:** Project Settings → API (URL, anon key, service_role key)  
- **SQL Editor:** v projektu → SQL Editor – sem vkládej migrace  
- **Storage:** vytvoř bucket `team-logos` (veřejný) a `player-photos` (veřejný), pokud používáš loga a fotky hráčů  
- **Access Token (pro migrace):** https://supabase.com/dashboard/account/tokens → vygeneruj Personal Access Token → do `.env.local` jako `SUPABASE_ACCESS_TOKEN`

---

## 5. Supabase – pořadí SQL migrací

Spouštěj v **SQL Editoru** v tomto pořadí (nová DB):

1. `scripts/setup-teams.sql` – tabulky teams, admin, RLS  
2. `scripts/setup-training-attendance.sql` – events, event_attendance  
3. `scripts/setup-player-voting.sql` – players, matches, ratings, match_goal_scorers, match_assists  
4. `scripts/add-event-columns.sql` nebo `scripts/add-event-note.sql` – start_time, note u events  
5. `scripts/add-start-time.sql` – start_time u events a matches  
6. `scripts/add-event-share-token.sql` – share_token pro události  
7. `scripts/add-match-result.sql` – goals_for, goals_against  
8. `scripts/add-match-scorers-assists.sql` – kanadské bodování  
9. `scripts/add-coach-player.sql` – coach_player_id u teams  
10. `scripts/add-team-background-color.sql` – background_color  
11. `scripts/add-player-photo.sql` – photo_url u players  
12. `scripts/add-attendance-finalized.sql` – attendance finalized  
13. `scripts/add-rating-zero.sql` – pokud používáš hodnocení 0–10  
14. `scripts/setup-supabase.sql` – jerseytype a další doplňky  
15. `scripts/verify-tables.sql` – kontrola, že tabulky existují  

Pro existující DB spouštěj jen chybějící skripty (ALTER TABLE ... ADD COLUMN IF NOT EXISTS atd.).

---

## 6. Vercel – rychlý checklist

- Repozitář napojený na Vercel (GitHub/GitLab/Bitbucket).  
- Build Command: `npm run build` (nebo výchozí).  
- Output Directory: výchozí (Next.js).  
- Root Directory: prázdné, pokud je projekt v kořeni repo.  
- Všechny 4 proměnné z oddílu 3 nastavené v Environment Variables.  
- Po změně env: Redeploy projektu.

---

## 7. Jeden blok – vše pro rychlé zkopírování

```
=== SUPABASE ===
NEXT_PUBLIC_SUPABASE_URL = (Project Settings → API → Project URL)
NEXT_PUBLIC_SUPABASE_ANON_KEY = (Project Settings → API → anon public)
SUPABASE_SERVICE_ROLE_KEY = (Project Settings → API → service_role)
SUPABASE_ACCESS_TOKEN = (Account → Access Tokens, volitelně)
SUPABASE_DATABASE_URL = (Settings → Database → Connection string, volitelně)

=== APP ===
JWT_SECRET = (náhodný řetězec min. 32 znaků)
MIGRATE_SECRET = (např. migrate-event-note-2024, volitelně)

=== VERCEL ===
Stejné proměnné jako výše v Settings → Environment Variables.
Nepoužívat default JWT_SECRET v produkci.
```

---

Konec dokumentu. Vše lze překopírovat do Codexu nebo použít jako šablonu pro .env a Vercel.
