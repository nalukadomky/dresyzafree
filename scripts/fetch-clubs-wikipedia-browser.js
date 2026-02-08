/**
 * SKRIPT PRO BROWSER KONZOLI - WIKIPEDIE
 * 
 * INSTRUKCE:
 * 1. Otevřete stránku: https://cs.wikipedia.org/wiki/Systém_fotbalových_soutěží_v_Česku
 * 2. Otevřete Developer Tools (F12)
 * 3. Přejděte na záložku Console
 * 4. Zkopírujte a vložte celý tento skript
 * 5. Stiskněte Enter
 * 6. Počkejte na dokončení (může trvat několik minut)
 * 7. Výsledky budou zkopírovány do clipboardu a zobrazeny v konzoli
 */

(async function() {
  console.log('🔍 Začínám stahování klubů z Wikipedie...\n');
  
  // Seznam URL soutěží, které chceme projít
  const competitionUrls = [
    'https://cs.wikipedia.org/wiki/1._%C4%8Desk%C3%A1_fotbalov%C3%A1_liga',
    'https://cs.wikipedia.org/wiki/2._%C4%8Desk%C3%A1_fotbalov%C3%A1_liga',
    'https://cs.wikipedia.org/wiki/%C4%8Cesk%C3%A1_fotbalov%C3%A1_liga',
    'https://cs.wikipedia.org/wiki/Moravskoslezsk%C3%A1_fotbalov%C3%A1_liga',
    'https://cs.wikipedia.org/wiki/Divize_A',
    'https://cs.wikipedia.org/wiki/Divize_B',
    'https://cs.wikipedia.org/wiki/Divize_C',
    'https://cs.wikipedia.org/wiki/Divize_D',
    'https://cs.wikipedia.org/wiki/Divize_E',
    'https://cs.wikipedia.org/wiki/Divize_F',
  ];
  
  const allClubs = new Set();
  
  console.log(`📋 Projdu ${competitionUrls.length} soutěží...\n`);
  
  for (let i = 0; i < competitionUrls.length; i++) {
    const url = competitionUrls[i];
    const competitionName = decodeURIComponent(url.split('/').pop().replace(/_/g, ' '));
    
    console.log(`[${i + 1}/${competitionUrls.length}] Zpracovávám: ${competitionName}`);
    
    try {
      // Načteme stránku
      const response = await fetch(url);
      const html = await response.text();
      
      // Vytvoříme dočasný DOM element pro parsování
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extrahujeme kluby z různých míst
      const clubs = new Set();
      
      // 1. Tabulky s kluby (často v <td> nebo <th>)
      const tableCells = doc.querySelectorAll('td, th');
      tableCells.forEach(cell => {
        const text = cell.textContent.trim();
        if (text && 
            (text.includes('FK') || text.includes('FC') || text.includes('SK') || 
             text.includes('TJ') || text.includes('AC') || text.includes('Sparta') ||
             text.includes('Slavia') || text.includes('Baník') || text.includes('Bohemians') ||
             text.includes('Dynamo') || text.includes('Viktoria') || text.includes('Slovan') ||
             text.includes('Spartak') || text.includes('Union') || text.includes('Admira') ||
             text.includes('Dukla') || text.includes('Zbrojovka') || text.includes('Vysočina'))) {
          const cleanText = text
            .replace(/\[.*?\]/g, '')
            .replace(/\([^)]*\)/g, '')
            .trim();
          
          if (cleanText.length > 2 && cleanText.length < 100 && 
              !cleanText.match(/^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$/i) &&
              !cleanText.match(/^\d+$/) &&
              !cleanText.includes('Poznámka') &&
              !cleanText.includes('Reference')) {
            clubs.add(cleanText);
          }
        }
      });
      
      // 2. Seznamy klubů v <li> tagů
      const listItems = doc.querySelectorAll('li');
      listItems.forEach(li => {
        const text = li.textContent.trim();
        if (text && 
            (text.includes('FK') || text.includes('FC') || text.includes('SK') || 
             text.includes('TJ') || text.includes('AC') || text.includes('Sparta') ||
             text.includes('Slavia') || text.includes('Baník') || text.includes('Bohemians') ||
             text.includes('Dynamo') || text.includes('Viktoria') || text.includes('Slovan') ||
             text.includes('Spartak') || text.includes('Union') || text.includes('Admira') ||
             text.includes('Dukla') || text.includes('Zbrojovka') || text.includes('Vysočina'))) {
          const cleanText = text
            .replace(/\[.*?\]/g, '')
            .replace(/\([^)]*\)/g, '')
            .trim();
          
          if (cleanText.length > 2 && cleanText.length < 100 && 
              !cleanText.match(/^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$/i) &&
              !cleanText.match(/^\d+$/) &&
              !cleanText.includes('Poznámka') &&
              !cleanText.includes('Reference')) {
            clubs.add(cleanText);
          }
        }
      });
      
      // 3. Odkazy na kluby
      const links = doc.querySelectorAll('a[href*="wiki"]');
      links.forEach(link => {
        const text = link.textContent.trim();
        if (text && 
            (text.includes('FK') || text.includes('FC') || text.includes('SK') || 
             text.includes('TJ') || text.includes('AC') || text.includes('Sparta') ||
             text.includes('Slavia') || text.includes('Baník') || text.includes('Bohemians') ||
             text.includes('Dynamo') || text.includes('Viktoria') || text.includes('Slovan') ||
             text.includes('Spartak') || text.includes('Union') || text.includes('Admira') ||
             text.includes('Dukla') || text.includes('Zbrojovka') || text.includes('Vysočina'))) {
          const cleanText = text
            .replace(/\[.*?\]/g, '')
            .trim();
          
          if (cleanText.length > 2 && cleanText.length < 100 && 
              !cleanText.match(/^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$/i) &&
              !cleanText.match(/^\d+$/) &&
              !cleanText.includes('Poznámka') &&
              !cleanText.includes('Reference')) {
            clubs.add(cleanText);
          }
        }
      });
      
      if (clubs.size > 0) {
        console.log(`  ✓ Nalezeno ${clubs.size} klubů`);
        clubs.forEach(club => allClubs.add(club));
      } else {
        console.log(`  ⚠ Nenalezeny žádné kluby`);
      }
      
      // Malá pauza
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`  ✗ Chyba: ${error.message}`);
    }
  }
  
  // Seřadíme výsledky
  const sortedClubs = Array.from(allClubs).sort();
  
  console.log(`\n📊 Statistiky:`);
  console.log(`   Celkem nalezeno: ${sortedClubs.length} unikátních klubů\n`);
  
  // Vytvoříme formátovaný výstup
  const clubsString = sortedClubs.map(club => `  '${club.replace(/'/g, "\\'")}',`).join('\n');
  const fullContent = `// Seznam českých fotbalových klubů z Wikipedie
// Automaticky vygenerováno z oficiálních zdrojů
// Datum: ${new Date().toISOString()}
// Celkem klubů: ${sortedClubs.length}

export const CZECH_FOOTBALL_CLUBS_WIKIPEDIA = [
${clubsString}
];`;
  
  // Zkopírujeme do clipboardu
  try {
    const textarea = document.createElement('textarea');
    textarea.value = fullContent;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    console.log('✅ Seznam klubů zkopírován do clipboardu!');
  } catch (error) {
    console.log('⚠ Nepodařilo se zkopírovat do clipboardu, zobrazuji výsledky:');
    console.log(fullContent);
  }
  
  console.log('\n📋 Prvních 30 klubů:');
  sortedClubs.slice(0, 30).forEach((club, i) => {
    console.log(`   ${i + 1}. ${club}`);
  });
  
  if (sortedClubs.length > 30) {
    console.log(`   ... a dalších ${sortedClubs.length - 30} klubů`);
  }
  
  console.log('\n💡 Vložte obsah z clipboardu do souboru data/czech-football-clubs.ts');
  console.log('   nebo použijte výsledky zobrazené výše.\n');
  
  return sortedClubs;
})();

