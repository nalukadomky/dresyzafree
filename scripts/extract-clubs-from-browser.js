/**
 * Skript pro extrakci klubů z aktuálně načtené stránky Wikipedie v browseru
 * Spusťte v browser konzoli na stránce s ligou
 */

(function() {
  const clubs = new Set();
  
  // Extrahujeme kluby z různých míst na stránce
  const selectors = [
    'td', 'th', 'li', 'a[href*="wiki"]'
  ];
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const text = el.textContent.trim();
      
      // Kontrolujeme, jestli text obsahuje znaky klubů
      if (text && 
          (text.includes('FK') || text.includes('FC') || text.includes('SK') || 
           text.includes('TJ') || text.includes('AC') || text.includes('Sparta') ||
           text.includes('Slavia') || text.includes('Baník') || text.includes('Bohemians') ||
           text.includes('Dynamo') || text.includes('Viktoria') || text.includes('Slovan') ||
           text.includes('Spartak') || text.includes('Union') || text.includes('Admira') ||
           text.includes('Dukla') || text.includes('Zbrojovka') || text.includes('Vysočina') ||
           text.includes('Rejšice') || text.includes('Sokol') || text.includes('Tatran'))) {
        
        const cleanText = text
          .replace(/\[.*?\]/g, '')
          .replace(/\([^)]*\)/g, '')
          .replace(/^\d+\.\s*/, '')
          .trim();
        
        if (cleanText.length > 2 && cleanText.length < 100 && 
            !cleanText.match(/^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$/i) &&
            !cleanText.match(/^\d+$/) &&
            !cleanText.includes('Poznámka') &&
            !cleanText.includes('Reference') &&
            !cleanText.includes('Externí') &&
            !cleanText.includes('Kategorie') &&
            !cleanText.includes('Soutěž') &&
            !cleanText.includes('Liga')) {
          clubs.add(cleanText);
        }
      }
    });
  });
  
  const sortedClubs = Array.from(clubs).sort();
  
  console.log(`✅ Nalezeno ${sortedClubs.length} klubů na této stránce:`);
  sortedClubs.forEach((club, i) => {
    console.log(`   ${i + 1}. ${club}`);
  });
  
  // Zkopírujeme do clipboardu
  const clubsString = sortedClubs.map(club => `  '${club.replace(/'/g, "\\'")}',`).join('\n');
  const fullContent = `// Kluby z ${document.title}\n${clubsString}`;
  
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
    console.log('\n✅ Seznam zkopírován do clipboardu!');
  } catch (error) {
    console.log('\n⚠ Nepodařilo se zkopírovat');
  }
  
  return sortedClubs;
})();

