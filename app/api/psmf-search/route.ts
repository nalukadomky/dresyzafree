import { NextRequest, NextResponse } from 'next/server';

// --- Types ---
interface PsmfTeam {
  name: string;
  slug: string;
  division: string;
  url: string;
}

// --- Team directory cache (24 h) ---
let teamDirCache: { data: PsmfTeam[]; ts: number } | null = null;
const DIR_CACHE_TTL = 24 * 60 * 60 * 1000;

const BASE = 'https://www.psmf.cz';
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; MyPitch/1.0)' };

/** Detect current season slug from psmf.cz main souteze page */
async function detectSeasonSlug(): Promise<string | null> {
  const res = await fetch(`${BASE}/souteze/`, { headers: UA });
  if (!res.ok) return null;
  const html = await res.text();
  const matches = html.match(/\/souteze\/(20\d{2}-hanspaulska-liga-[^/]+)\//g);
  if (!matches || matches.length === 0) return null;
  const slugs = matches.map((m) => {
    const sm = m.match(/\/souteze\/([^/]+)\//);
    return sm ? sm[1] : '';
  }).filter(Boolean);
  const unique = [...new Set(slugs)].sort().reverse();
  return unique[0] || null;
}

/** Fetch division URLs from season page */
async function getDivisionUrls(seasonSlug: string): Promise<{ path: string; label: string }[]> {
  const url = `${BASE}/souteze/${seasonSlug}/`;
  const res = await fetch(url, { headers: UA });
  if (!res.ok) return [];
  const html = await res.text();

  const divisions: { path: string; label: string }[] = [];
  const regex = new RegExp(
    `href="(/souteze/${seasonSlug}/(\\d+)-([a-z]+)/)"`,
    'gi'
  );
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = regex.exec(html)) !== null) {
    const path = m[1];
    if (seen.has(path)) continue;
    seen.add(path);
    const league = m[2];
    const group = m[3].toUpperCase();
    divisions.push({ path, label: `${league}. liga ${group}` });
  }
  return divisions;
}

/** Fetch teams from a single division page */
async function getTeamsFromDivision(
  divisionPath: string,
  divisionLabel: string,
  seasonSlug: string
): Promise<PsmfTeam[]> {
  const url = `${BASE}${divisionPath}`;
  const res = await fetch(url, { headers: UA });
  if (!res.ok) return [];
  const html = await res.text();

  const teams: PsmfTeam[] = [];
  const regex = new RegExp(
    `<a\\s+href="(/souteze/${seasonSlug}/[^/]+/tymy/([^"/]+)/?)"[^>]*title="([^"]+)"`,
    'gi'
  );
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = regex.exec(html)) !== null) {
    const slug = m[2];
    if (seen.has(slug)) continue;
    seen.add(slug);
    teams.push({
      name: m[3],
      slug,
      division: divisionLabel,
      url: `${BASE}${m[1]}`,
    });
  }
  return teams;
}

/** Build full team directory with caching */
async function getTeamDirectory(): Promise<PsmfTeam[]> {
  if (teamDirCache && Date.now() - teamDirCache.ts < DIR_CACHE_TTL) {
    return teamDirCache.data;
  }

  const seasonSlug = await detectSeasonSlug();
  if (!seasonSlug) {
    throw new Error('Nepodařilo se zjistit aktuální sezónu na psmf.cz');
  }

  const divisions = await getDivisionUrls(seasonSlug);
  if (divisions.length === 0) {
    throw new Error('Nebyly nalezeny žádné skupiny');
  }

  // Fetch all divisions in parallel (batched to limit concurrency)
  const BATCH_SIZE = 10;
  const allTeams: PsmfTeam[] = [];

  for (let i = 0; i < divisions.length; i += BATCH_SIZE) {
    const batch = divisions.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((d) => getTeamsFromDivision(d.path, d.label, seasonSlug))
    );
    for (const teams of results) {
      allTeams.push(...teams);
    }
  }

  teamDirCache = { data: allTeams, ts: Date.now() };
  return allTeams;
}

// --- Route handler ---

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query: string = (body.name || '').trim();

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Zadejte alespoň 2 znaky názvu klubu.' },
        { status: 400 }
      );
    }

    let directory: PsmfTeam[];
    try {
      directory = await getTeamDirectory();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Nepodařilo se načíst seznam týmů.';
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    // Case-insensitive substring match
    const q = query.toLowerCase();
    const results = directory.filter((t) => t.name.toLowerCase().includes(q));

    return NextResponse.json({
      teams: results.slice(0, 30),
      total: results.length,
      directorySize: directory.length,
    });
  } catch {
    return NextResponse.json(
      { error: 'Neočekávaná chyba serveru.' },
      { status: 500 }
    );
  }
}
