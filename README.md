# ByHana REFORMER – Pilates studio

Web pro Pilates studio ByHana REFORMER: úvod (co, kde), ceník, nabídka lekcí a rezervační systém. Provizorní texty a údaje.

## Technologie

- **Vite** ^6, **Tailwind CSS** ^3.4, čistý HTML/CSS/JS (bez frameworku)
- Barvy: #F3D585 (gold), #FFEDD8 (cream), #BC8A5F (brown)
- Fonty: Outfit (sans), Fraunces (display)

## Vývoj

```bash
npm install
npm run dev
```

Otevřete [http://localhost:5173](http://localhost:5173).

## Produkční build

```bash
npm run build
```

Výstup v `dist/`.

## Náhled buildu

```bash
npm run preview
```

## Struktura

- `index.html` – úvod, co nabízíme, kde nás najdete
- `cenik.html` – jednorázové lekce a permanentky
- `lekce.html` – typy lekcí a orientační rozvrh
- `rezervace.html` – rezervační formulář (odeslání přes mailto)
- `src/main.js` – mobilní menu, obsluha rezervačního formuláře
- `src/style.css` – Tailwind, fonty, utility
- `tailwind.config.js` – barvy (cream, gold, brown), fonty
- `public/images/` – obrázky (viz OBRAZKY-README.txt)

## Nasazení na server

Po naklonování nebo stažení z Gitu na server:

```bash
npm install
npm run build
```

Webový server (nginx, Apache) nasměrujte na složku **`dist/`** – ta obsahuje hotový web.

## Úpravy

- **Texty a ceny**: upravte přímo v HTML (index, cenik, lekce, rezervace).
- **Kontaktní e-mail**: v `src/main.js` konstanta `CONTACT_EMAIL`.
- **Barvy/fonty**: `tailwind.config.js` a `src/style.css`.
