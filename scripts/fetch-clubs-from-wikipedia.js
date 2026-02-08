/**
 * Skript pro získání všech klubů z Wikipedie procházením všech soutěží
 * Projde všechny ligy a soutěže v ČR a extrahuje názvy klubů
 */

const fs = require('fs');
const path = require('path');

// Seznam odkazů na soutěže z Wikipedie
const WIKIPEDIA_COMPETITIONS = [
  // 1. liga
  'https://cs.wikipedia.org/wiki/1._%C4%8Desk%C3%A1_fotbalov%C3%A1_liga',
  
  // 2. liga
  'https://cs.wikipedia.org/wiki/2._%C4%8Desk%C3%A1_fotbalov%C3%A1_liga',
  
  // 3. ligy
  'https://cs.wikipedia.org/wiki/%C4%8Cesk%C3%A1_fotbalov%C3%A1_liga',
  'https://cs.wikipedia.org/wiki/Moravskoslezsk%C3%A1_fotbalov%C3%A1_liga',
  
  // 4. ligy (Divize)
  'https://cs.wikipedia.org/wiki/Divize_A',
  'https://cs.wikipedia.org/wiki/Divize_B',
  'https://cs.wikipedia.org/wiki/Divize_C',
  'https://cs.wikipedia.org/wiki/Divize_D',
  'https://cs.wikipedia.org/wiki/Divize_E',
  'https://cs.wikipedia.org/wiki/Divize_F',
  
  // Krajské přebory (5. ligy) - budeme muset najít odkazy
  // I. A třídy (6. ligy)
  // I. B třídy (7. ligy)
  // atd.
];

async function fetchHTML(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`❌ Chyba při načítání ${url}: ${response.status}`);
      return '';
    }
    return await response.text();
  } catch (error) {
    console.error(`❌ Chyba při načítání ${url}:`, error.message);
    return '';
  }
}

function extractClubsFromHTML(html, competitionName) {
  const clubs = new Set();
  
  // Různé vzory pro extrakci názvů klubů z Wikipedie
  // Wikipedie často používá tabulky s kluby
  
  // Vzor 1: Tabulky s kluby (často v <td> nebo <th>)
  const tablePattern = /<t[dh][^>]*>([^<]*(?:FK|FC|SK|TJ|AC|Sparta|Slavia|Baník|Bohemians|Dynamo|Viktoria|Slovan|Spartak|Union|Admira|Dukla|Zbrojovka|Vysočina)[^<]*)<\/t[dh]>/gi;
  let match;
  
  while ((match = tablePattern.exec(html)) !== null) {
    const clubName = match[1]
      .replace(/\[.*?\]/g, '') // Odstraníme odkazy [1]
      .replace(/\([^)]*\)/g, '') // Odstraníme závorky s poznámkami
      .trim();
    
    if (clubName && clubName.length > 2 && clubName.length < 100) {
      // Filtrujeme neplatné názvy
      if (!clubName.match(/^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$/i) &&
          !clubName.match(/^\d+$/) &&
          !clubName.includes('Poznámka') &&
          !clubName.includes('Reference') &&
          !clubName.includes('Externí') &&
          !clubName.includes('Kategorie')) {
        clubs.add(clubName);
      }
    }
  }
  
  // Vzor 2: Seznamy klubů v <li> tagů
  const listPattern = /<li[^>]*>([^<]*(?:FK|FC|SK|TJ|AC|Sparta|Slavia|Baník|Bohemians|Dynamo|Viktoria|Slovan|Spartak|Union|Admira|Dukla|Zbrojovka|Vysočina)[^<]*)<\/li>/gi;
  
  while ((match = listPattern.exec(html)) !== null) {
    const clubName = match[1]
      .replace(/\[.*?\]/g, '')
      .replace(/\([^)]*\)/g, '')
      .trim();
    
    if (clubName && clubName.length > 2 && clubName.length < 100) {
      if (!clubName.match(/^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$/i) &&
          !clubName.match(/^\d+$/) &&
          !clubName.includes('Poznámka') &&
          !clubName.includes('Reference')) {
        clubs.add(clubName);
      }
    }
  }
  
  // Vzor 3: Odkazy na kluby
  const linkPattern = /<a[^>]*href="[^"]*wiki[^"]*"[^>]*>([^<]*(?:FK|FC|SK|TJ|AC|Sparta|Slavia|Baník|Bohemians|Dynamo|Viktoria|Slovan|Spartak|Union|Admira|Dukla|Zbrojovka|Vysočina)[^<]*)<\/a>/gi;
  
  while ((match = linkPattern.exec(html)) !== null) {
    const clubName = match[1]
      .replace(/\[.*?\]/g, '')
      .trim();
    
    if (clubName && clubName.length > 2 && clubName.length < 100) {
      if (!clubName.match(/^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$/i) &&
          !clubName.match(/^\d+$/) &&
          !clubName.includes('Poznámka') &&
          !clubName.includes('Reference')) {
        clubs.add(clubName);
      }
    }
  }
  
  return Array.from(clubs);
}

async function main() {
  console.log('🔍 Začínám stahování klubů z Wikipedie...\n');
  
  const allClubs = new Set();
  let processed = 0;
  
  for (const url of WIKIPEDIA_COMPETITIONS) {
    processed++;
    const competitionName = url.split('/').pop().replace(/_/g, ' ');
    console.log(`[${processed}/${WIKIPEDIA_COMPETITIONS.length}] Zpracovávám: ${competitionName}`);
    
    const html = await fetchHTML(url);
    
    if (!html) {
      console.log('  ⚠ Nepodařilo se načíst stránku');
      continue;
    }
    
    const clubs = extractClubsFromHTML(html, competitionName);
    
    if (clubs.length > 0) {
      console.log(`  ✓ Nalezeno ${clubs.length} klubů`);
      clubs.forEach(club => allClubs.add(club));
    } else {
      console.log(`  ⚠ Nenalezeny žádné kluby`);
    }
    
    // Malá pauza, abychom nepřetížili server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Seřadíme výsledky
  const sortedClubs = Array.from(allClubs).sort();
  
  console.log(`\n📊 Statistiky:`);
  console.log(`   Celkem nalezeno: ${sortedClubs.length} unikátních klubů\n`);
  
  // Načteme existující kluby
  const existingClubsPath = path.join(process.cwd(), 'data', 'czech-football-clubs.ts');
  let existingClubs = [];
  
  if (fs.existsSync(existingClubsPath)) {
    const existingContent = fs.readFileSync(existingClubsPath, 'utf-8');
    const existingMatch = existingContent.match(/'([^']+)'/g);
    if (existingMatch) {
      existingClubs = existingMatch.map(m => m.replace(/'/g, ''));
    }
  }
  
  // Zkombinujeme existující a nové kluby
  const combinedClubs = Array.from(new Set([...existingClubs, ...sortedClubs]));
  combinedClubs.sort();
  
  console.log(`📝 Aktualizuji seznam klubů...`);
  console.log(`   Původní kluby: ${existingClubs.length}`);
  console.log(`   Nové kluby z Wikipedie: ${sortedClubs.length}`);
  console.log(`   Celkem po sloučení: ${combinedClubs.length}\n`);
  
  // Uložení do souboru
  const content = `// Seznam českých fotbalových klubů
// Automaticky vygenerováno z Wikipedie a dalších zdrojů
// Datum: ${new Date().toISOString()}
// Kluby z Wikipedie: ${sortedClubs.length}
// Celkem klubů: ${combinedClubs.length}

export const CZECH_FOOTBALL_CLUBS = [
${combinedClubs.map(club => `  '${club.replace(/'/g, "\\'")}',`).join('\n')}
];
`;
  
  fs.writeFileSync(existingClubsPath, content, 'utf-8');
  console.log(`✅ Seznam klubů aktualizován: ${existingClubsPath}`);
  
  // Zobrazíme prvních 30 klubů
  console.log('\n📋 Prvních 30 klubů z Wikipedie:');
  sortedClubs.slice(0, 30).forEach((club, i) => {
    console.log(`   ${i + 1}. ${club}`);
  });
}

main().catch(console.error);

