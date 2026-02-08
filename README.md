# Dresy za free

Aplikace pro správu registrace týmů a distribuce dresů.

## Instalace

```bash
npm install
```

## Spuštění

```bash
npm run dev
```

Aplikace poběží na [http://localhost:3000](http://localhost:3000)

## Funkce

- **Homepage**: Logo a tlačítko pro registraci
- **Registrace**: Formulář pro registraci týmu
- **Přihlášení**: Přihlášení pro týmy a správce
- **Uživatelský panel**: Zobrazení typu dresů a časovače
- **Admin panel**: Správa týmů a nastavení parametrů

## Výchozí admin přihlašovací údaje

- Uživatelské jméno: `admin`
- Heslo: `admin123`

**POZOR**: Po prvním spuštění změňte heslo admina v produkci!

## Databáze

Data se ukládají do JSON souborů v adresáři `/data`:
- `teams.json` - registrované týmy
- `admin.json` - admin přihlašovací údaje

## Nahrazení loga

Nahrajte logo do `public/logo.png` a odkomentujte Image komponentu v `app/page.tsx`.

