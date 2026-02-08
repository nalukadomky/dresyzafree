/**
 * Skript pro získání reálných názvů klubů z FAČR webu
 * Tento skript stáhne seznam klubů z různých zdrojů FAČR
 */

import fs from 'fs';
import path from 'path';

// URL pro různé krajské fotbalové svazy
const REGIONAL_FEDERATIONS = [
  'http://skfs.msquare.cz/cz/s2213/Adresare/c2242-Kluby/multipage-2214-1-6', // Středočeský kraj
  // Můžeme přidat další URL pro jiné kraje
];

async function fetchClubsFromURL(url: string): Promise<string[]> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Parsování HTML pro získání názvů klubů
    // Toto je základní implementace - může být potřeba upravit podle struktury HTML
    const clubMatches = html.match(/<td[^>]*>([^<]+(?:FK|FC|SK|TJ|AC|FK)[^<]+)<\/td>/gi) || [];
    const clubs: string[] = [];
    
    clubMatches.forEach(match => {
      const clubName = match.replace(/<[^>]+>/g, '').trim();
      if (clubName && clubName.length > 2) {
        clubs.push(clubName);
      }
    });
    
    return clubs;
  } catch (error) {
    console.error(`Chyba při načítání klubů z ${url}:`, error);
    return [];
  }
}

async function main() {
  console.log('Začínám stahování klubů z FAČR...');
  
  const allClubs: string[] = [];
  
  for (const url of REGIONAL_FEDERATIONS) {
    console.log(`Stahuji kluby z: ${url}`);
    const clubs = await fetchClubsFromURL(url);
    allClubs.push(...clubs);
    console.log(`Nalezeno ${clubs.length} klubů`);
  }
  
  // Odstranění duplicit
  const uniqueClubs = Array.from(new Set(allClubs));
  
  console.log(`Celkem nalezeno ${uniqueClubs.length} unikátních klubů`);
  
  // Uložení do souboru
  const outputPath = path.join(process.cwd(), 'data', 'czech-football-clubs-facr.ts');
  const content = `// Seznam českých fotbalových klubů z FAČR
// Automaticky vygenerováno z oficiálních zdrojů
// Datum: ${new Date().toISOString()}

export const CZECH_FOOTBALL_CLUBS_FAČR = [
${uniqueClubs.map(club => `  '${club.replace(/'/g, "\\'")}',`).join('\n')}
];
`;
  
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`Seznam klubů uložen do: ${outputPath}`);
}

main().catch(console.error);

