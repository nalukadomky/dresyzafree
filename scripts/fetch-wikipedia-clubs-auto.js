/**
 * Automatický skript pro získání všech klubů z Wikipedie
 * Projde všechny ligy včetně 7. ligy (I. B třídy) a doplní chybějící kluby
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Seznam URL soutěží včetně nižších lig
const competitionUrls = [
  // 1-2. liga
  'https://cs.wikipedia.org/wiki/1._%C4%8Desk%C3%A1_fotbalov%C3%A1_liga',
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
  
  // 5. ligy (krajské přebory)
  'https://cs.wikipedia.org/wiki/Krajsk%C3%A9_p%C5%99ebory',
  'https://cs.wikipedia.org/wiki/Pra%C5%BEsk%C3%BD_p%C5%99ebor',
  
  // 6. ligy (I. A třídy)
  'https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_I._A_t%C5%99%C3%ADdy',
  
  // 7. ligy (I. B třídy) - TADY JSOU KLUBY JAKO REJŠICE
  'https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_I._B_t%C5%99%C3%ADdy',
  
  // 8. ligy (II. třídy)
  'https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_II._t%C5%99%C3%ADdy',
  
  // 9. ligy (III. třídy)
  'https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_III._t%C5%99%C3%ADdy',
  
  // 10. ligy (IV. třídy)
  'https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_IV._t%C5%99%C3%ADdy',
];

function fetchURL(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

function extractClubsFromHTML(html) {
  const clubs = new Set();
  
  // Vzor pro extrakci klubů z různých formátů
  const patterns = [
    // Tabulky: <td> nebo <th> s názvem klubu
    /<t[dh][^>]*>([^<]*(?:FK|FC|SK|TJ|AC|Sparta|Slavia|Baník|Bohemians|Dynamo|Viktoria|Slovan|Spartak|Union|Admira|Dukla|Zbrojovka|Vysočina|Rejšice|Sokol|Tatran)[^<]*)<\/t[dh]>/gi,
    
    // Seznamy: <li> s názvem klubu
    /<li[^>]*>([^<]*(?:FK|FC|SK|TJ|AC|Sparta|Slavia|Baník|Bohemians|Dynamo|Viktoria|Slovan|Spartak|Union|Admira|Dukla|Zbrojovka|Vysočina|Rejšice|Sokol|Tatran)[^<]*)<\/li>/gi,
    
    // Odkazy: <a> s názvem klubu
    /<a[^>]*href="[^"]*wiki[^"]*"[^>]*>([^<]*(?:FK|FC|SK|TJ|AC|Sparta|Slavia|Baník|Bohemians|Dynamo|Viktoria|Slovan|Spartak|Union|Admira|Dukla|Zbrojovka|Vysočina|Rejšice|Sokol|Tatran)[^<]*)<\/a>/gi,
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let clubName = match[1]
        .replace(/\[.*?\]/g, '') // Odstraníme odkazy [1]
        .replace(/\([^)]*\)/g, '') // Odstraníme závorky
        .replace(/^\d+\.\s*/, '') // Odstraníme čísla na začátku
        .trim();
      
      // Filtrujeme platné názvy klubů
      if (clubName && 
          clubName.length > 2 && 
          clubName.length < 100 &&
          !clubName.match(/^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$/i) &&
          !clubName.match(/^\d+$/) &&
          !clubName.includes('Poznámka') &&
          !clubName.includes('Reference') &&
          !clubName.includes('Externí') &&
          !clubName.includes('Kategorie') &&
          !clubName.includes('Soutěž') &&
          !clubName.includes('Liga')) {
        clubs.add(clubName);
      }
    }
  });
  
  return Array.from(clubs);
}

async function main() {
  console.log('🔍 Začínám automatické stahování klubů z Wikipedie...\n');
  
  const allClubs = new Set();
  
  for (let i = 0; i < competitionUrls.length; i++) {
    const url = competitionUrls[i];
    const competitionName = decodeURIComponent(url.split('/').pop().replace(/_/g, ' '));
    
    process.stdout.write(`[${i + 1}/${competitionUrls.length}] Zpracovávám: ${competitionName}... `);
    
    try {
      const html = await fetchURL(url);
      const clubs = extractClubsFromHTML(html);
      
      if (clubs.length > 0) {
        console.log(`✓ ${clubs.length} klubů`);
        clubs.forEach(club => allClubs.add(club));
      } else {
        console.log(`⚠ 0 klubů`);
      }
      
      // Malá pauza, abychom nepřetížili server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`✗ Chyba: ${error.message}`);
    }
  }
  
  // Seřadíme výsledky
  const sortedClubs = Array.from(allClubs).sort();
  
  console.log(`\n📊 Statistiky:`);
  console.log(`   Celkem nalezeno: ${sortedClubs.length} unikátních klubů`);
  
  // Zkontrolujeme Rejšice
  const rejsiceFound = sortedClubs.some(club => club.includes('Rejšice'));
  console.log(`   Rejšice nalezeno: ${rejsiceFound ? '✓ ANO' : '✗ NE'}\n`);
  
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
// Automaticky vygenerováno z Wikipedie a dalších zdrojů včetně 7. ligy (I. B třídy)
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
  console.log('\n📋 Prvních 30 nových klubů z Wikipedie:');
  sortedClubs.slice(0, 30).forEach((club, i) => {
    console.log(`   ${i + 1}. ${club}`);
  });
  
  if (sortedClubs.length > 30) {
    console.log(`   ... a dalších ${sortedClubs.length - 30} klubů`);
  }
}

main().catch(console.error);

