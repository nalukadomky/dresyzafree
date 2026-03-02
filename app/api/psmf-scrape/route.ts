import { NextRequest, NextResponse } from 'next/server';

// --- Types ---
interface PsmfParsedMatch {
  uid: string;
  date: string;
  startTime: string;
  opponent: string;
  venueName: string;
  venueAbbrev: string;
  round: string;
  isHome: boolean;
  summary: string;
}

interface VenueInfo {
  name: string;
  address: string;
}

// --- Venue cache (24 h TTL) ---
let venueCache: { data: Map<string, VenueInfo>; ts: number } | null = null;
const VENUE_CACHE_TTL = 24 * 60 * 60 * 1000;

// --- Helpers ---

/** Parse psmf.cz date format: "Po 16.3.26" or "Po&nbsp;16.3.26" → "2026-03-16" */
function parsePsmfDate(raw: string): string | null {
  const cleaned = raw.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  const m = cleaned.match(/(\d{1,2})\.(\d{1,2})\.(\d{2})/);
  if (!m) return null;
  const day = m[1].padStart(2, '0');
  const month = m[2].padStart(2, '0');
  const year = 2000 + parseInt(m[3], 10);
  return `${year}-${month}-${day}`;
}

/** Strip HTML tags */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

/** Parse venue mapping from /hriste/ page HTML.
 *  Structure: <tr> rows with 3 <td>s:
 *    td[0] = venue name (e.g. "Meteor 8")
 *    td[1] = abbreviation anchors (e.g. <a name="METE1">METE1</a>)
 *    td[2] = address + details (first line is the address)
 */
function parseVenueMapping(html: string): Map<string, VenueInfo> {
  const map = new Map<string, VenueInfo>();

  // Find all table rows in the venues section
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    // Extract <td> cells
    const tds: string[] = [];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      tds.push(tdMatch[1]);
    }
    if (tds.length < 3) continue;

    const venueName = stripTags(tds[0]);
    if (!venueName || venueName === 'Hřiště' || venueName.includes('Adresa')) continue;

    // Extract abbreviation codes from <a name="CODE">
    const codeRegex = /<a\s+name="([^"]+)"/gi;
    const codes: string[] = [];
    let codeMatch: RegExpExecArray | null;
    while ((codeMatch = codeRegex.exec(tds[1])) !== null) {
      codes.push(codeMatch[1]);
    }

    // Extract address (first line of td[2], before <br>)
    const addressRaw = tds[2].split(/<br\s*\/?>/i)[0];
    const address = stripTags(addressRaw);

    for (const code of codes) {
      map.set(code, { name: venueName, address });
    }
  }

  return map;
}

/** Fetch and cache venue mapping */
async function getVenueMapping(): Promise<Map<string, VenueInfo>> {
  if (venueCache && Date.now() - venueCache.ts < VENUE_CACHE_TTL) {
    return venueCache.data;
  }
  const res = await fetch('https://www.psmf.cz/hriste/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyPitch/1.0)' },
  });
  if (!res.ok) {
    throw new Error('Nepodařilo se načíst stránku hřišť');
  }
  const html = await res.text();
  const data = parseVenueMapping(html);
  venueCache = { data, ts: Date.now() };
  return data;
}

/** Parse match rows from team page HTML.
 *  Table structure: <tr> rows with 5 <td>s:
 *    td[0] = date (e.g. "Po&nbsp;16.3.26")
 *    td[1] = time (e.g. "19:00")
 *    td[2] = venue link (e.g. <a href="/hriste/#METE1">METE1</a>)
 *    td[3] = teams with links (home <a> ... away <a>)
 *    td[4] = round (e.g. "1.")
 */
function parseMatchRows(
  html: string,
  teamSlug: string,
  venues: Map<string, VenueInfo>
): PsmfParsedMatch[] {
  const matches: PsmfParsedMatch[] = [];

  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let trMatch: RegExpExecArray | null;
  while ((trMatch = trRegex.exec(html)) !== null) {
    const rowHtml = trMatch[1];
    // Skip header rows
    if (rowHtml.includes('<th')) continue;

    const tds: string[] = [];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdMatch: RegExpExecArray | null;
    while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
      tds.push(tdMatch[1]);
    }
    if (tds.length < 5) continue;

    // Date
    const date = parsePsmfDate(tds[0]);
    if (!date) continue;

    // Time
    const timeText = stripTags(tds[1]).trim();
    const timeMatch = timeText.match(/(\d{1,2}:\d{2})/);
    const startTime = timeMatch ? timeMatch[1] : '';
    if (!startTime) continue;

    // Venue abbreviation
    const venueAnchorMatch = tds[2].match(/href="\/hriste\/#([^"]+)"/);
    const venueAbbrev = venueAnchorMatch ? venueAnchorMatch[1] : stripTags(tds[2]);
    const venueInfo = venues.get(venueAbbrev);
    const venueName = venueInfo ? `${venueInfo.name}, ${venueInfo.address}` : '';

    // Teams — extract <a> tags with /tymy/ in href
    const teamLinkRegex = /<a\s+href="[^"]*\/tymy\/([^"/]+)\/?[^"]*"[^>]*title="([^"]+)"[^>]*>/gi;
    const teams: { slug: string; name: string }[] = [];
    let teamLinkMatch: RegExpExecArray | null;
    while ((teamLinkMatch = teamLinkRegex.exec(tds[3])) !== null) {
      teams.push({ slug: teamLinkMatch[1], name: teamLinkMatch[2] });
    }
    if (teams.length < 2) continue;

    const homeTeam = teams[0];
    const awayTeam = teams[1];

    // Determine if the user's team is home or away
    const slugNorm = teamSlug.toLowerCase().replace(/\/$/, '');
    const isHome = homeTeam.slug.toLowerCase() === slugNorm;
    const opponent = isHome ? awayTeam.name : homeTeam.name;

    // Round
    const roundText = stripTags(tds[4]).replace('.', '').trim();

    const uid = `${date}|${startTime}|${opponent.toLowerCase()}`;
    const summary = `${isHome ? 'Doma' : 'Venku'} vs ${opponent} | ${venueAbbrev} | Kolo ${roundText}`;

    matches.push({
      uid,
      date,
      startTime,
      opponent,
      venueName,
      venueAbbrev,
      round: roundText,
      isHome,
      summary,
    });
  }

  return matches;
}

// --- Route handler ---

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url: string = (body.url || '').trim();

    // Validate URL
    const urlPattern = /^https?:\/\/(www\.)?psmf\.cz\/souteze\/[^/]+\/[^/]+\/tymy\/([^/]+)\/?$/;
    const urlMatch = url.match(urlPattern);
    if (!urlMatch) {
      return NextResponse.json(
        { error: 'Neplatná URL. Očekávaný formát: https://www.psmf.cz/souteze/.../tymy/nazev-tymu/' },
        { status: 400 }
      );
    }
    const teamSlug = urlMatch[2];

    // Fetch team page
    let teamHtml: string;
    try {
      const teamRes = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyPitch/1.0)' },
      });
      if (!teamRes.ok) {
        return NextResponse.json(
          { error: `Stránka týmu vrátila chybu ${teamRes.status}.` },
          { status: 502 }
        );
      }
      teamHtml = await teamRes.text();
    } catch {
      return NextResponse.json(
        { error: 'Nepodařilo se spojit s psmf.cz. Zkuste to později.' },
        { status: 502 }
      );
    }

    // Check if page contains match table
    if (!teamHtml.includes('Domácí - Hosté') && !teamHtml.includes('Domácí - Host')) {
      return NextResponse.json(
        { error: 'Na stránce nebyl nalezen rozpis zápasů. Zkontrolujte URL.' },
        { status: 404 }
      );
    }

    // Fetch venue mapping
    let venues: Map<string, VenueInfo>;
    try {
      venues = await getVenueMapping();
    } catch {
      // Continue without venue mapping
      venues = new Map();
    }

    // Parse matches
    const matches = parseMatchRows(teamHtml, teamSlug, venues);

    if (matches.length === 0) {
      return NextResponse.json(
        { error: 'Nepodařilo se naparsovat žádné zápasy. Struktura stránky se mohla změnit.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ matches, teamSlug });
  } catch {
    return NextResponse.json(
      { error: 'Neočekávaná chyba serveru.' },
      { status: 500 }
    );
  }
}
