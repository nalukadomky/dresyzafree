import { NextRequest, NextResponse } from 'next/server';

// --- Types ---
interface StrahovskaParsedMatch {
  uid: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  opponent: string;
  fieldNumber: string; // "1", "2", "3", etc. or ""
  isHome: boolean;
  summary: string;
}

const BASE = 'https://www.strahovskaliga.cz';
const UA = { 'User-Agent': 'Mozilla/5.0 (compatible; MyPitch/1.0)' };

// --- ICS Parsing ---

/** Parse ICS VEVENT entries into matches */
function parseIcsEvents(
  icsText: string,
  teamName: string
): Omit<StrahovskaParsedMatch, 'fieldNumber'>[] {
  const events: Omit<StrahovskaParsedMatch, 'fieldNumber'>[] = [];

  // Split into VEVENT blocks
  const vEventBlocks = icsText.split('BEGIN:VEVENT');

  for (let i = 1; i < vEventBlocks.length; i++) {
    const block = vEventBlocks[i].split('END:VEVENT')[0];

    // Parse DTSTART — format: 20260302T210000
    const dtMatch = block.match(/DTSTART[^:]*:(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
    if (!dtMatch) continue;

    const date = `${dtMatch[1]}-${dtMatch[2]}-${dtMatch[3]}`;
    const startTime = `${dtMatch[4]}:${dtMatch[5]}`;

    // Parse SUMMARY — format: "TeamA vs. TeamB"
    const summaryMatch = block.match(/SUMMARY[^:]*:(.+)/);
    if (!summaryMatch) continue;
    const summary = summaryMatch[1].replace(/\\n/g, ' ').replace(/\r/g, '').trim();

    // Determine home/away and opponent from "TeamA vs. TeamB"
    const vsMatch = summary.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
    if (!vsMatch) continue;

    const teamA = vsMatch[1].trim();
    const teamB = vsMatch[2].trim();

    // Determine which side is our team using case-insensitive comparison
    const teamNameLower = teamName.toLowerCase();
    const isHome = teamA.toLowerCase() === teamNameLower ||
      teamA.toLowerCase().includes(teamNameLower) ||
      teamNameLower.includes(teamA.toLowerCase());
    const opponent = isHome ? teamB : teamA;

    const uid = `${date}|${startTime}|${opponent.toLowerCase()}`;

    events.push({
      uid,
      date,
      startTime,
      opponent,
      isHome,
      summary: `${isHome ? 'Doma' : 'Venku'} vs ${opponent}`,
    });
  }

  return events;
}

// --- Field number enrichment from PrehledZapasu ---

/** Format date for PrehledZapasu query parameter: "D.M.YYYY" */
function formatDateForQuery(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${parseInt(day, 10)}.${parseInt(month, 10)}.${year}`;
}

/** Fetch field number for a team from PrehledZapasu page for a given date */
async function getFieldNumbersForDate(
  dateStr: string,
  tid: string
): Promise<Map<string, string>> {
  const fieldMap = new Map<string, string>(); // key: "HH:MM" -> value: field number

  try {
    const queryDate = formatDateForQuery(dateStr);
    const res = await fetch(`${BASE}/PrehledZapasu/?datum=${queryDate}`, { headers: UA });
    if (!res.ok) return fieldMap;
    const html = await res.text();

    // Parse table rows looking for our TID
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch: RegExpExecArray | null;
    while ((trMatch = trRegex.exec(html)) !== null) {
      const rowHtml = trMatch[1];
      // Check if this row contains our team TID
      if (!rowHtml.includes(`TID=${tid}`)) continue;

      // Extract field number from "Hřiště č. X"
      const fieldMatch = rowHtml.match(/Hřiště\s+č\.\s*(\d+)/i);
      const fieldNumber = fieldMatch ? fieldMatch[1] : '';

      // Extract time from "D. M. - HH:MM" pattern
      const timeMatch = rowHtml.match(/\d+\.\s*\d+\.\s*-\s*(\d{1,2}:\d{2})/);
      const time = timeMatch ? timeMatch[1] : '';

      if (time && fieldNumber) {
        fieldMap.set(time, fieldNumber);
      }
    }
  } catch {
    // Silently ignore — field numbers are optional enrichment
  }

  return fieldMap;
}

// --- Route handler ---

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tid: string = (body.tid || '').trim();
    const teamName: string = (body.teamName || '').trim();

    if (!tid || !teamName) {
      return NextResponse.json(
        { error: 'Chybí ID týmu nebo název.' },
        { status: 400 }
      );
    }

    // Step 1: Fetch ICS calendar
    let icsText: string;
    try {
      const icsRes = await fetch(`${BASE}/Kalendare/Zapasy-Team${tid}.ics`, { headers: UA });
      if (!icsRes.ok) {
        return NextResponse.json(
          { error: `Nepodařilo se stáhnout kalendář týmu (HTTP ${icsRes.status}).` },
          { status: 502 }
        );
      }
      icsText = await icsRes.text();
    } catch {
      return NextResponse.json(
        { error: 'Nepodařilo se spojit se strahovskaliga.cz. Zkuste to později.' },
        { status: 502 }
      );
    }

    if (!icsText.includes('VEVENT')) {
      return NextResponse.json(
        { error: 'Kalendář neobsahuje žádné zápasy.' },
        { status: 404 }
      );
    }

    // Step 2: Parse ICS events
    const rawMatches = parseIcsEvents(icsText, teamName);
    if (rawMatches.length === 0) {
      return NextResponse.json(
        { error: 'Nepodařilo se naparsovat žádné zápasy z kalendáře.' },
        { status: 500 }
      );
    }

    // Step 3: Enrich with field numbers from PrehledZapasu
    // Group matches by date to minimize HTTP requests
    const dateGroups = new Map<string, typeof rawMatches>();
    for (const match of rawMatches) {
      const existing = dateGroups.get(match.date) || [];
      existing.push(match);
      dateGroups.set(match.date, existing);
    }

    // Fetch field numbers for each unique date (batched, max 5 concurrent)
    const dateEntries = Array.from(dateGroups.entries());
    const BATCH_SIZE = 5;
    const fieldCache = new Map<string, Map<string, string>>();

    for (let i = 0; i < dateEntries.length; i += BATCH_SIZE) {
      const batch = dateEntries.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(([date]) => getFieldNumbersForDate(date, tid).then((m) => ({ date, m })))
      );
      for (const { date, m } of results) {
        fieldCache.set(date, m);
      }
    }

    // Merge field numbers into matches
    const matches: StrahovskaParsedMatch[] = rawMatches.map((match) => {
      const dateFields = fieldCache.get(match.date);
      const fieldNumber = dateFields?.get(match.startTime) || '';
      const locationSuffix = fieldNumber ? `, hřiště č. ${fieldNumber}` : '';
      return {
        ...match,
        fieldNumber,
        summary: `${match.summary}${locationSuffix}`,
      };
    });

    return NextResponse.json({ matches, tid, teamName });
  } catch {
    return NextResponse.json(
      { error: 'Neočekávaná chyba serveru.' },
      { status: 500 }
    );
  }
}
