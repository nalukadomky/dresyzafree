import { NextRequest, NextResponse } from 'next/server';

// --- Types ---
interface StrahovskaTeam {
  name: string;
  tid: string;
  division: string;
  url: string;
}

// --- Team directory cache (24 h) ---
let teamDirCache: { data: StrahovskaTeam[]; ts: number } | null = null;
const DIR_CACHE_TTL = 24 * 60 * 60 * 1000;

const BASE = 'https://www.strahovskaliga.cz';
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; MyPitch/1.0)' };

// All 8 divisions
const DIVISIONS: { lid: number; label: string }[] = [
  { lid: 1, label: '1. liga' },
  { lid: 2, label: '2. liga' },
  { lid: 3, label: '3. liga' },
  { lid: 4, label: '4. liga' },
  { lid: 7, label: '5. liga' },
  { lid: 5, label: '1. ženská liga' },
  { lid: 6, label: '2. ženská liga' },
  { lid: 8, label: 'Studentská liga' },
];

/** Fetch teams from a single division page */
async function getTeamsFromDivision(lid: number, label: string): Promise<StrahovskaTeam[]> {
  const res = await fetch(`${BASE}/Liga?LID=${lid}`, { headers: UA });
  if (!res.ok) return [];
  const html = await res.text();

  const teams: StrahovskaTeam[] = [];
  // Pattern: <a href="../TymProfil/?TID=1431" title="Kolemjdoucí">
  const regex = /href="\.\.\/TymProfil\/\?TID=(\d+)"[^>]*title="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((m = regex.exec(html)) !== null) {
    const tid = m[1];
    if (seen.has(tid)) continue;
    seen.add(tid);
    teams.push({
      name: m[2],
      tid,
      division: label,
      url: `${BASE}/TymProfil/?TID=${tid}`,
    });
  }
  return teams;
}

/** Build full team directory with caching */
async function getTeamDirectory(): Promise<StrahovskaTeam[]> {
  if (teamDirCache && Date.now() - teamDirCache.ts < DIR_CACHE_TTL) {
    return teamDirCache.data;
  }

  // Fetch all divisions in parallel
  const results = await Promise.all(
    DIVISIONS.map((d) => getTeamsFromDivision(d.lid, d.label))
  );
  const allTeams: StrahovskaTeam[] = [];
  for (const teams of results) {
    allTeams.push(...teams);
  }

  if (allTeams.length === 0) {
    throw new Error('Nepodařilo se načíst žádné týmy ze strahovskaliga.cz');
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

    let directory: StrahovskaTeam[];
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
