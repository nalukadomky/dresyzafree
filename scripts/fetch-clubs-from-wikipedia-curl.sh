#!/bin/bash

# Skript pro získání všech klubů z Wikipedie pomocí curl

echo "🔍 Začínám stahování klubů z Wikipedie...\n"

# Seznam odkazů na soutěže
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
)

TEMP_DIR=$(mktemp -d)
ALL_CLUBS_FILE="$TEMP_DIR/all_clubs.txt"

echo "📋 Začínám procházení ${#URLS[@]} soutěží...\n"

for i in "${!URLS[@]}"; do
  URL="${URLS[$i]}"
  NUM=$((i + 1))
  TOTAL=${#URLS[@]}
  
  echo "[$NUM/$TOTAL] Stahuji: $URL"
  
  # Stáhneme HTML
  HTML=$(curl -s -L "$URL" -H "User-Agent: Mozilla/5.0")
  
  if [ -z "$HTML" ]; then
    echo "  ⚠ Nepodařilo se načíst stránku"
    continue
  fi
  
  # Extrahujeme kluby z různých vzorů
  # Vzor 1: Tabulky s kluby
  echo "$HTML" | grep -oE '<t[dh][^>]*>[^<]*(FK|FC|SK|TJ|AC|Sparta|Slavia|Baník|Bohemians|Dynamo|Viktoria|Slovan|Spartak|Union|Admira|Dukla|Zbrojovka|Vysočina)[^<]*</t[dh]>' | \
    sed 's/<[^>]*>//g' | \
    sed 's/\[.*\]//g' | \
    sed 's/([^)]*)//g' | \
    sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | \
    grep -v '^$' | \
    grep -vE '^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$' | \
    grep -vE '^[0-9]+$' >> "$ALL_CLUBS_FILE"
  
  # Vzor 2: Seznamy klubů
  echo "$HTML" | grep -oE '<li[^>]*>[^<]*(FK|FC|SK|TJ|AC|Sparta|Slavia|Baník|Bohemians|Dynamo|Viktoria|Slovan|Spartak|Union|Admira|Dukla|Zbrojovka|Vysočina)[^<]*</li>' | \
    sed 's/<[^>]*>//g' | \
    sed 's/\[.*\]//g' | \
    sed 's/([^)]*)//g' | \
    sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | \
    grep -v '^$' | \
    grep -vE '^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$' | \
    grep -vE '^[0-9]+$' >> "$ALL_CLUBS_FILE"
  
  # Vzor 3: Odkazy na kluby
  echo "$HTML" | grep -oE '<a[^>]*href="[^"]*wiki[^"]*"[^>]*>[^<]*(FK|FC|SK|TJ|AC|Sparta|Slavia|Baník|Bohemians|Dynamo|Viktoria|Slovan|Spartak|Union|Admira|Dukla|Zbrojovka|Vysočina)[^<]*</a>' | \
    sed 's/<[^>]*>//g' | \
    sed 's/\[.*\]//g' | \
    sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | \
    grep -v '^$' | \
    grep -vE '^(P|Z|V|R|B|M|G|A|D|S|K|L|O|N|H|T|I|E|C|F|J|U|W|X|Y|Z)$' | \
    grep -vE '^[0-9]+$' >> "$ALL_CLUBS_FILE"
  
  echo "  ✓ Zpracováno"
  
  # Malá pauza
  sleep 1
done

# Odstraníme duplicity a seřadíme
UNIQUE_CLUBS=$(sort -u "$ALL_CLUBS_FILE" | grep -v '^$')
TOTAL=$(echo "$UNIQUE_CLUBS" | wc -l | tr -d ' ')

echo "\n📊 Statistiky:"
echo "   Celkem nalezeno: $TOTAL unikátních klubů\n"

# Uložíme do souboru
echo "$UNIQUE_CLUBS" > "$TEMP_DIR/wikipedia_clubs.txt"
echo "💾 Seznam klubů uložen do: $TEMP_DIR/wikipedia_clubs.txt"

# Zobrazíme prvních 30
echo "\n📋 Prvních 30 klubů:"
echo "$UNIQUE_CLUBS" | head -30 | nl

# Vyčistíme
# rm -rf "$TEMP_DIR"

echo "\n✅ Hotovo! Výsledky jsou v: $TEMP_DIR"

