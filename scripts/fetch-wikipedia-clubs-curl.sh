#!/bin/bash

# Automatický skript pro získání všech klubů z Wikipedie pomocí curl

echo "🔍 Začínám automatické stahování klubů z Wikipedie...\n"

# Seznam URL soutěží
URLS=(
  "https://cs.wikipedia.org/wiki/1._%C4%8Desk%C3%A1_fotbalov%C3%A1_liga"
  "https://cs.wikipedia.org/wiki/2._%C4%8Desk%C3%A1_fotbalov%C3%A1_liga"
  "https://cs.wikipedia.org/wiki/%C4%8Cesk%C3%A1_fotbalov%C3%A1_liga"
  "https://cs.wikipedia.org/wiki/Moravskoslezsk%C3%A1_fotbalov%C3%A1_liga"
  "https://cs.wikipedia.org/wiki/Divize_A"
  "https://cs.wikipedia.org/wiki/Divize_B"
  "https://cs.wikipedia.org/wiki/Divize_C"
  "https://cs.wikipedia.org/wiki/Divize_D"
  "https://cs.wikipedia.org/wiki/Divize_E"
  "https://cs.wikipedia.org/wiki/Divize_F"
  "https://cs.wikipedia.org/wiki/Krajsk%C3%A9_p%C5%99ebory"
  "https://cs.wikipedia.org/wiki/Pra%C5%BEsk%C3%BD_p%C5%99ebor"
  "https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_I._A_t%C5%99%C3%ADdy"
  "https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_I._B_t%C5%99%C3%ADdy"
  "https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_II._t%C5%99%C3%ADdy"
  "https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_III._t%C5%99%C3%ADdy"
  "https://cs.wikipedia.org/wiki/Fotbalov%C3%A9_IV._t%C5%99%C3%ADdy"
)

TEMP_DIR=$(mktemp -d)
ALL_CLUBS_FILE="$TEMP_DIR/all_clubs.txt"

echo "📋 Začínám procházení ${#URLS[@]} soutěží...\n"

for i in "${!URLS[@]}"; do
  URL="${URLS[$i]}"
  NUM=$((i + 1))
  TOTAL=${#URLS[@]}
  
  COMPETITION_NAME=$(echo "$URL" | sed 's/.*wiki\///' | sed 's/_/ /g' | python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.stdin.read().strip()))" 2>/dev/null || echo "$URL")
  
  process.stdout?.write || echo -n "[$NUM/$TOTAL] Zpracovávám: $COMPETITION_NAME... "
  
  # Stáhneme HTML
  HTML=$(curl -s -L "$URL" -H "User-Agent: Mozilla/5.0" 2>/dev/null)
  
  if [ -z "$HTML" ]; then
    echo "⚠ Nepodařilo se načíst"
    continue
  fi
  
  # Extrahujeme kluby z různých formátů
  # Tabulky
  echo "$HTML" | grep -oE '<t[dh][^>]*>[^<]*(FK|FC|SK|TJ|AC|Sparta|Slavia|Baník|Bohemians|Dynamo|Viktoria|Slovan|Spartak|Union|Admira|Dukla|Zbrojovka|Vysočina|Rejšice|Sokol|Tatran)[^<]*</t[dh]>' | \
    sed 's/<[^>]*>//g' | \
    sed 's/\[.*\]//g' | \
    sed 's/([^)]*)//g' | \
    sed 's/^[0-9]*\.\s*//' | \
    sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | \
    grep -v '^$' | \
    grep -vE '^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$' | \
    grep -vE '^[0-9]+$' | \
    grep -v 'Poznámka' | \
    grep -v 'Reference' | \
    grep -v 'Externí' | \
    grep -v 'Kategorie' | \
    grep -v 'Soutěž' | \
    grep -v 'Liga' >> "$ALL_CLUBS_FILE"
  
  # Seznamy
  echo "$HTML" | grep -oE '<li[^>]*>[^<]*(FK|FC|SK|TJ|AC|Sparta|Slavia|Baník|Bohemians|Dynamo|Viktoria|Slovan|Spartak|Union|Admira|Dukla|Zbrojovka|Vysočina|Rejšice|Sokol|Tatran)[^<]*</li>' | \
    sed 's/<[^>]*>//g' | \
    sed 's/\[.*\]//g' | \
    sed 's/([^)]*)//g' | \
    sed 's/^[0-9]*\.\s*//' | \
    sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | \
    grep -v '^$' | \
    grep -vE '^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$' | \
    grep -vE '^[0-9]+$' | \
    grep -v 'Poznámka' | \
    grep -v 'Reference' >> "$ALL_CLUBS_FILE"
  
  # Odkazy
  echo "$HTML" | grep -oE '<a[^>]*href="[^"]*wiki[^"]*"[^>]*>[^<]*(FK|FC|SK|TJ|AC|Sparta|Slavia|Baník|Bohemians|Dynamo|Viktoria|Slovan|Spartak|Union|Admira|Dukla|Zbrojovka|Vysočina|Rejšice|Sokol|Tatran)[^<]*</a>' | \
    sed 's/<[^>]*>//g' | \
    sed 's/\[.*\]//g' | \
    sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | \
    grep -v '^$' | \
    grep -vE '^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$' | \
    grep -vE '^[0-9]+$' | \
    grep -v 'Poznámka' | \
    grep -v 'Reference' >> "$ALL_CLUBS_FILE"
  
  CLUB_COUNT=$(grep -c . "$ALL_CLUBS_FILE" 2>/dev/null || echo "0")
  echo "✓ ($CLUB_COUNT celkem)"
  
  sleep 1
done

# Odstraníme duplicity a seřadíme
UNIQUE_CLUBS=$(sort -u "$ALL_CLUBS_FILE" 2>/dev/null | grep -v '^$')
TOTAL=$(echo "$UNIQUE_CLUBS" | wc -l | tr -d ' ')

echo "\n📊 Statistiky:"
echo "   Celkem nalezeno: $TOTAL unikátních klubů"

# Zkontrolujeme Rejšice
REJSICE_FOUND=$(echo "$UNIQUE_CLUBS" | grep -i "rejšice" | wc -l | tr -d ' ')
echo "   Rejšice nalezeno: $([ "$REJSICE_FOUND" -gt 0 ] && echo "✓ ANO" || echo "✗ NE")\n"

# Načteme existující kluby
EXISTING_FILE="data/czech-football-clubs.ts"
EXISTING_CLUBS=0

if [ -f "$EXISTING_FILE" ]; then
  EXISTING_CLUBS=$(grep -oE "'([^']+)'" "$EXISTING_FILE" | sed "s/'//g" | wc -l | tr -d ' ')
fi

# Uložíme výsledky
echo "$UNIQUE_CLUBS" > "$TEMP_DIR/wikipedia_clubs.txt"
echo "💾 Seznam klubů uložen do: $TEMP_DIR/wikipedia_clubs.txt"

echo "\n📋 Prvních 30 klubů:"
echo "$UNIQUE_CLUBS" | head -30 | nl

echo "\n✅ Hotovo! Výsledky jsou v: $TEMP_DIR/wikipedia_clubs.txt"
echo "💡 Zkombinujte s existujícími kluby v $EXISTING_FILE"

