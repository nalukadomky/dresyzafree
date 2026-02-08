/**
 * Skript pro získání VŠECH klubů z FAČR webu procházením všech soutěží
 * Používá curl a parsování HTML
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://skfs.msquare.cz/cz/s2213/Adresare/c2242-Kluby/multipage-2214-1-6';

interface Competition {
  value: string;
  name: string;
}

function fetchHTML(url: string): string {
  try {
    return execSync(`curl -s "${url}"`, { encoding: 'utf-8' });
  } catch (error) {
    console.error(`Chyba při stahování ${url}:`, error);
    return '';
  }
}

function extractCompetitions(html: string): Competition[] {
  const competitions: Competition[] = [];
  const optionRegex = /<option value="(\d+)">([^<]+)<\/option>/g;
  let match;
  
  while ((match = optionRegex.exec(html)) !== null) {
    const value = match[1];
    const name = match[2].trim();
    // Přeskočíme prázdnou možnost
    if (value && name && name !== '') {
      competitions.push({ value, name });
    }
  }
  
  return competitions;
}

function extractClubs(html: string): string[] {
  const clubs: string[] = [];
  const h4Regex = /<h4[^>]*>([^<]+)<\/h4>/g;
  let match;
  
  while ((match = h4Regex.exec(html)) !== null) {
    const clubName = match[1].trim();
    // Filtrujeme neplatné názvy
    if (clubName && 
        clubName.length > 2 && 
        !clubName.includes('WebActionInfo') &&
        !clubName.includes('SKFS') &&
        !clubName.match(/^\d+$/) && // Ne jen čísla
        clubName.length < 100) { // Ne příliš dlouhé
      clubs.push(clubName);
    }
  }
  
  return clubs;
}

async function main() {
  console.log('🔍 Začínám stahování všech klubů z FAČR...\n');
  
  // Získáme základní HTML
  console.log('📋 Načítám seznam soutěží...');
  const baseHTML = fetchHTML(BASE_URL);
  const competitions = extractCompetitions(baseHTML);
  console.log(`✅ Nalezeno ${competitions.length} soutěží\n`);
  
  const allClubs: string[] = [];
  let processed = 0;
  let totalClubs = 0;
  
  // Projdeme každou soutěž
  for (const competition of competitions) {
    processed++;
    console.log(`[${processed}/${competitions.length}] Zpracovávám: ${competition.name}`);
    
    // Zkusíme získat kluby pro tuto soutěž
    // Stránka používá POST, ale zkusíme zjistit, jestli funguje GET s parametrem
    const url = `${BASE_URL}?DisciplineId=${competition.value}`;
    const html = fetchHTML(url);
    const clubs = extractClubs(html);
    
    if (clubs.length > 0) {
      console.log(`  ✓ Nalezeno ${clubs.length} klubů`);
      allClubs.push(...clubs);
      totalClubs += clubs.length;
    } else {
      console.log(`  ⚠ Nenalezeny žádné kluby (možná vyžaduje POST request)`);
    }
    
    // Malá pauza, abychom nepřetížili server
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Odstranění duplicit
  const uniqueClubs = Array.from(new Set(allClubs));
  uniqueClubs.sort();
  
  console.log(`\n📊 Statistiky:`);
  console.log(`   Celkem nalezeno: ${totalClubs} klubů`);
  console.log(`   Po odstranění duplicit: ${uniqueClubs.length} unikátních klubů\n`);
  
  // Načteme existující kluby
  const existingClubsPath = path.join(process.cwd(), 'data', 'czech-football-clubs.ts');
  let existingClubs: string[] = [];
  
  if (fs.existsSync(existingClubsPath)) {
    const existingContent = fs.readFileSync(existingClubsPath, 'utf-8');
    const existingMatch = existingContent.match(/'([^']+)'/g);
    if (existingMatch) {
      existingClubs = existingMatch.map(m => m.replace(/'/g, ''));
    }
  }
  
  // Zkombinujeme existující a nové kluby
  const combinedClubs = Array.from(new Set([...existingClubs, ...uniqueClubs]));
  combinedClubs.sort();
  
  console.log(`📝 Aktualizuji seznam klubů...`);
  console.log(`   Původní kluby: ${existingClubs.length}`);
  console.log(`   Nové kluby z FAČR: ${uniqueClubs.length}`);
  console.log(`   Celkem po sloučení: ${combinedClubs.length}\n`);
  
  // Uložení do souboru
  const content = `// Seznam českých fotbalových klubů
// Automaticky vygenerováno z FAČR zdrojů (Středočeský kraj)
// Datum: ${new Date().toISOString()}
// Počet soutěží: ${competitions.length}
// Kluby z FAČR: ${uniqueClubs.length}
// Celkem klubů: ${combinedClubs.length}

export const CZECH_FOOTBALL_CLUBS = [
${combinedClubs.map(club => `  '${club.replace(/'/g, "\\'")}',`).join('\n')}
];
`;
  
  fs.writeFileSync(existingClubsPath, content, 'utf-8');
  console.log(`✅ Seznam klubů aktualizován: ${existingClubsPath}`);
}

main().catch(console.error);

