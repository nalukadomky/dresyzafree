# Návod na získání všech klubů z FAČR pomocí browser MCP

Stránka FAČR vyžaduje POST requesty s WebActionInfo tokenem, který se mění. 
Nejspolehlivější způsob je použít browser automation k procházení všech soutěží.

## Postup:

1. Otevřít stránku: http://skfs.msquare.cz/cz/s2213/Adresare/c2242-Kluby/multipage-2214-1-6
2. Pro každou soutěž v dropdownu:
   - Vybrat soutěž
   - Počkat na načtení klubů
   - Extrahovat všechny kluby z <h4> tagů
   - Uložit do seznamu
3. Zkombinovat všechny kluby a odstranit duplicity
4. Aktualizovat data/czech-football-clubs.ts

## Alternativní řešení:

Můžeme zkusit najít jiný zdroj dat nebo použít web scraping s Puppeteer/Playwright,
ale to vyžaduje instalaci dalších závislostí.

