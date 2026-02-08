/**
 * Skript pro získání VŠECH klubů z FAČR pomocí browser automation
 * Tento skript by měl být spuštěn v browser konzoli na stránce FAČR
 */

// Zkopírujte a vložte tento kód do browser konzole na stránce:
// http://skfs.msquare.cz/cz/s2213/Adresare/c2242-Kluby/multipage-2214-1-6

(async function() {
  console.log('🔍 Začínám stahování všech klubů z FAČR...\n');
  
  // Najdeme select element
  const select = document.querySelector('select[name*="DisciplineId"]') || 
                 document.querySelector('#filter_club_list_filter_class-club') ||
                 document.querySelector('select[id*="class-club"]');
  
  if (!select) {
    console.error('❌ Nepodařilo se najít select element!');
    return;
  }
  
  console.log(`✅ Nalezen select element s ${select.options.length} možnostmi\n`);
  
  const allClubs = new Set();
  const competitions = [];
  
  // Získáme seznam všech soutěží
  for (let i = 0; i < select.options.length; i++) {
    const option = select.options[i];
    if (option.value && option.value !== '') {
      competitions.push({
        value: option.value,
        name: option.text.trim()
      });
    }
  }
  
  console.log(`📋 Nalezeno ${competitions.length} soutěží\n`);
  
  // Projdeme každou soutěž
  for (let i = 0; i < competitions.length; i++) {
    const competition = competitions[i];
    console.log(`[${i + 1}/${competitions.length}] Zpracovávám: ${competition.name}`);
    
    // Vybereme soutěž
    select.value = competition.value;
    
    // Spustíme change event (stránka používá onchange)
    const event = new Event('change', { bubbles: true });
    select.dispatchEvent(event);
    
    // Počkáme na načtení (stránka používá AJAX)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extrahujeme kluby z <h4> tagů
    const h4Elements = document.querySelectorAll('h4');
    const clubs = Array.from(h4Elements)
      .map(el => el.textContent.trim())
      .filter(text => 
        text && 
        text.length > 2 && 
        !text.includes('WebActionInfo') &&
        !text.includes('SKFS') &&
        !text.match(/^\d+$/) &&
        text.length < 100
      );
    
    if (clubs.length > 0) {
      console.log(`  ✓ Nalezeno ${clubs.length} klubů`);
      clubs.forEach(club => allClubs.add(club));
    } else {
      console.log(`  ⚠ Nenalezeny žádné kluby`);
    }
  }
  
  // Seřadíme a zobrazíme výsledky
  const sortedClubs = Array.from(allClubs).sort();
  
  console.log(`\n📊 Statistiky:`);
  console.log(`   Celkem nalezeno: ${sortedClubs.length} unikátních klubů\n`);
  
  // Zkopírujeme výsledky do clipboardu
  const clubsString = sortedClubs.map(club => `  '${club.replace(/'/g, "\\'")}',`).join('\n');
  const fullContent = `export const CZECH_FOOTBALL_CLUBS_FAČR = [\n${clubsString}\n];`;
  
  // Vytvoříme textarea pro kopírování
  const textarea = document.createElement('textarea');
  textarea.value = fullContent;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  
  console.log('✅ Seznam klubů zkopírován do clipboardu!');
  console.log('\n📋 Prvních 20 klubů:');
  sortedClubs.slice(0, 20).forEach((club, i) => {
    console.log(`   ${i + 1}. ${club}`);
  });
  
  return sortedClubs;
})();

