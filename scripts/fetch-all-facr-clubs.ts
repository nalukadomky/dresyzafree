/**
 * Skript pro získání VŠECH klubů z FAČR webu procházením všech soutěží
 * Tento skript stáhne seznam klubů z každé soutěže
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://skfs.msquare.cz/cz/s2213/Adresare/c2242-Kluby/multipage-2214-1-6';

interface Competition {
  value: string;
  name: string;
}

async function fetchCompetitions(): Promise<Competition[]> {
  try {
    const response = await fetch(BASE_URL);
    const html = await response.text();
    
    // Extrahujeme všechny option hodnoty (soutěže)
    const optionRegex = /<option value="(\d+)">([^<]+)<\/option>/g;
    const competitions: Competition[] = [];
    let match;
    
    while ((match = optionRegex.exec(html)) !== null) {
      competitions.push({
        value: match[1],
        name: match[2].trim()
      });
    }
    
    return competitions;
  } catch (error) {
    console.error('Chyba při načítání soutěží:', error);
    return [];
  }
}

async function fetchClubsFromCompetition(competitionValue: string, competitionName: string): Promise<string[]> {
  try {
    // Zkusíme POST request s filtrem soutěže
    const formData = new URLSearchParams();
    formData.append('competition', competitionValue);
    
    // Zkusíme GET request s parametrem
    const url = `${BASE_URL}?competition=${competitionValue}`;
    let response = await fetch(url);
    let html = await response.text();
    
    // Pokud to nefunguje, zkusíme POST
    if (!html.includes('<h4>')) {
      response = await fetch(BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });
      html = await response.text();
    }
    
    // Extrahujeme všechny kluby z <h4> tagů
    const clubRegex = /<h4[^>]*>([^<]+)<\/h4>/g;
    const clubs: string[] = [];
    let match;
    
    while ((match = clubRegex.exec(html)) !== null) {
      const clubName = match[1].trim();
      if (clubName && clubName.length > 2 && !clubName.includes('WebActionInfo')) {
        clubs.push(clubName);
      }
    }
    
    if (clubs.length > 0) {
      console.log(`  ✓ ${competitionName}: ${clubs.length} klubů`);
    }
    
    return clubs;
  } catch (error) {
    console.error(`  ✗ Chyba při načítání klubů ze soutěže ${competitionName}:`, error);
    return [];
  }
}

async function main() {
  console.log('🔍 Začínám stahování všech klubů z FAČR...\n');
  
  // Získáme seznam všech soutěží
  console.log('📋 Načítám seznam soutěží...');
  const competitions = await fetchCompetitions();
  console.log(`✅ Nalezeno ${competitions.length} soutěží\n`);
  
  const allClubs: string[] = [];
  let processed = 0;
  
  // Projdeme každou soutěž
  for (const competition of competitions) {
    processed++;
    console.log(`[${processed}/${competitions.length}] Zpracovávám: ${competition.name}`);
    
    const clubs = await fetchClubsFromCompetition(competition.value, competition.name);
    allClubs.push(...clubs);
    
    // Malá pauza, abychom nepřetížili server
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Odstranění duplicit
  const uniqueClubs = Array.from(new Set(allClubs));
  uniqueClubs.sort();
  
  console.log(`\n✅ Celkem nalezeno ${uniqueClubs.length} unikátních klubů`);
  
  // Uložení do souboru
  const outputPath = path.join(process.cwd(), 'data', 'czech-football-clubs-facr.ts');
  const content = `// Seznam českých fotbalových klubů z FAČR (Středočeský kraj)
// Automaticky vygenerováno z oficiálních zdrojů
// Datum: ${new Date().toISOString()}
// Počet soutěží: ${competitions.length}
// Celkem klubů: ${uniqueClubs.length}

export const CZECH_FOOTBALL_CLUBS_FAČR = [
${uniqueClubs.map(club => `  '${club.replace(/'/g, "\\'")}',`).join('\n')}
];
`;
  
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`💾 Seznam klubů uložen do: ${outputPath}`);
  
  // Také aktualizujeme hlavní soubor
  const mainPath = path.join(process.cwd(), 'data', 'czech-football-clubs.ts');
  const mainContent = `// Seznam českých fotbalových klubů
// Automaticky vygenerováno z FAČR zdrojů
// Datum: ${new Date().toISOString()}

export const CZECH_FOOTBALL_CLUBS = [
${uniqueClubs.map(club => `  '${club.replace(/'/g, "\\'")}',`).join('\n')}
];
`;
  
  fs.writeFileSync(mainPath, mainContent, 'utf-8');
  console.log(`💾 Hlavní soubor aktualizován: ${mainPath}`);
}

main().catch(console.error);

