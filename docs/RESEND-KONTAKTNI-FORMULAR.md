# Návod: Kontaktní formulář s Resend (free plan)

Krok za krokem, jak přidat kontaktní formulář na stránku Kontakt a posílat e-maily přes Resend. Obsah webu se nemění, přidá se jen formulář a backend pro odeslání.

---

## 1. Účet a Free plan Resend

1. Jdi na **[resend.com](https://resend.com)** a klikni **Sign up**.
2. Vytvoř si účet (e-mail nebo Google).
3. Free plan má:
   - **100 e-mailů denně**, **3 000 měsíčně**
   - 1 doména (nebo Resend testovací doména pro vývoj)
   - API klíč pro odesílání

---

## 2. API klíč a odesílatel

1. V Resend dashboardu: **API Keys** → **Create API Key**.
2. Pojmenuj klíč (např. `byhana-kontakt-web`), zvol **Sending access**.
3. **Zkopíruj klíč** (začíná `re_...`) – znovu se nezobrazí. Ulož ho do poznámek, později ho dáš do prostředí (env) na Vercel/Netlify.
4. V **Domains**:
   - **Produkce:** Přidej svou doménu (např. `byhana-reformer.cz`) a nastav DNS záznamy podle návodu (SPF, DKIM). E-maily pak půjdou z `info@byhana-reformer.cz` nebo `kontakt@...`.
   - **Testování:** Můžeš zatím posílat z `onboarding@resend.dev` – příjemce uvidí tento odesílatel. Ideální na ověření, že formulář funguje.

---

## 3. Kam dát „backend“ (bez změny obsahu webu)

Statický web sám neumí volat Resend API (klíč by byl v prohlížeči). Potřebuješ malý endpoint, který formulář přijme a e-mail pošle.

Doporučení: **Vercel** (nebo Netlify) – hostuješ tam stejný web a přidáš jednu serverless funkci.

### 3a. Vercel (doporučeno)

1. Účet na **[vercel.com](https://vercel.com)** (GitHub login).
2. **Add New** → **Project** → import repozitáře z GitHubu (např. `byhana_reformer`).
3. Po nasazení projektu půjde web na `xxx.vercel.app`. Později můžeš napojit vlastní doménu.

### 3b. Netlify

1. Účet na **[netlify.com](https://netlify.com)**.
2. **Add new site** → **Import an existing project** → GitHub → vyber repozitář.
3. Build: **Build command** prázdné, **Publish directory** např. `.` (nebo složka, kde máš `index.html`).

---

## 4. Struktura souborů v projektu

Do repozitáře přidáš:

```
byhana-reformer/
├── api/
│   └── send-contact.js    # Vercel Serverless Function (viz krok 5)
├── kontakt.html           # sem přidáš formulář (viz krok 6)
├── js/
│   └── contact-form.js    # odeslání formuláře na /api/send-contact (viz krok 7)
└── ...
```

Netlify používá složku `netlify/functions/` – název souboru = název endpointu (např. `send-contact.js` → `/api/send-contact` nebo `.netlify/functions/send-contact`).

---

## 5. Serverless funkce (Vercel) – posílá e-mail přes Resend

Vercel: soubor **`api/send-contact.js`** automaticky vytvoří endpoint **`/api/send-contact`**.

```javascript
// api/send-contact.js
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || 'onboarding@resend.dev';
const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'info@byhana-reformer.cz';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body || {};
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return res.status(400).json({ error: 'Vyplňte jméno, e-mail a zprávu.' });
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Server nemá nastaven Resend API klíč.' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [TO_EMAIL],
        subject: `Kontakt z webu: ${name}`,
        text: `Jméno: ${name}\nE-mail: ${email}\n\nZpráva:\n${message}`,
        reply_to: email,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || response.statusText);
    }

    const data = await response.json();
    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: err.message || 'E-mail se nepodařilo odeslat.' });
  }
}
```

**Proměnné prostředí na Vercel:**

1. Vercel → tvůj projekt → **Settings** → **Environment Variables**.
2. Přidej:
   - `RESEND_API_KEY` = tvůj klíč z Resend (např. `re_...`).
   - `RESEND_FROM` = odesílatel (produkce: např. `kontakt@byhana-reformer.cz`; test: `onboarding@resend.dev`).
   - `CONTACT_TO_EMAIL` = kam chodí zprávy (např. `info@byhana-reformer.cz`).

U Netlify je to **Site settings** → **Environment variables** a funkce v `netlify/functions/send-contact.js` – logika stejná, jen export a způsob volání se liší (Netlify Functions v2 používají `exports.handler`).

---

## 6. Formulář v `kontakt.html` (bez měnění stávajícího obsahu)

Pod blok s tlačítky (E-mail, Instagram, Rezervovat) můžeš přidat sekci jen s formulářem, např.:

```html
<section class="mt-12 pt-10 border-t border-brown-600/20">
  <h2 class="font-display text-xl font-semibold text-brown-800 mb-4">Napište nám</h2>
  <form id="contact-form" class="space-y-4 max-w-md">
    <div>
      <label for="contact-name" class="block text-sm font-medium text-brown-800 mb-1">Jméno</label>
      <input type="text" id="contact-name" name="name" required
             class="w-full px-4 py-2 border border-brown-600/30 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-brown-600"
             placeholder="Vaše jméno">
    </div>
    <div>
      <label for="contact-email" class="block text-sm font-medium text-brown-800 mb-1">E-mail</label>
      <input type="email" id="contact-email" name="email" required
             class="w-full px-4 py-2 border border-brown-600/30 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-brown-600"
             placeholder="vas@email.cz">
    </div>
    <div>
      <label for="contact-message" class="block text-sm font-medium text-brown-800 mb-1">Zpráva</label>
      <textarea id="contact-message" name="message" required rows="4"
                class="w-full px-4 py-2 border border-brown-600/30 rounded-lg focus:ring-2 focus:ring-gold-400 focus:border-brown-600"
                placeholder="Vaše zpráva..."></textarea>
    </div>
    <button type="submit" class="px-6 py-3 bg-brown-800 text-cream-50 rounded-full font-medium hover:bg-brown-900 transition">
      Odeslat
    </button>
    <p id="contact-form-status" class="text-sm hidden"></p>
  </form>
</section>
```

Styly můžeš doladit podle tvého Tailwindu; obsah stránky (adresa, e-mail, mapa) zůstává jak je.

---

## 7. JavaScript – odeslání na endpoint

Soubor **`js/contact-form.js`** (na stránce Kontakt ho načti v `<head>` nebo před `</body>`):

```javascript
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const statusEl = document.getElementById('contact-form-status');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const origText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Odesílám…';
    statusEl.classList.add('hidden');

    try {
      const res = await fetch('/api/send-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.querySelector('[name="name"]').value.trim(),
          email: form.querySelector('[name="email"]').value.trim(),
          message: form.querySelector('[name="message"]').value.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        statusEl.textContent = 'Zpráva byla odeslána. Brzy vás budeme kontaktovat.';
        statusEl.className = 'text-sm text-green-700';
        statusEl.classList.remove('hidden');
        form.reset();
      } else {
        statusEl.textContent = data.error || 'Něco se pokazilo. Zkuste to později nebo napište na info@byhana-reformer.cz.';
        statusEl.className = 'text-sm text-red-700';
        statusEl.classList.remove('hidden');
      }
    } catch (err) {
      statusEl.textContent = 'Chyba připojení. Zkuste to později.';
      statusEl.className = 'text-sm text-red-700';
      statusEl.classList.remove('hidden');
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  });
});
```

V `kontakt.html` přidej před `</body>`:

```html
<script src="js/contact-form.js" defer></script>
```

**Důležité:** URL `/api/send-contact` platí, když je web nasazený na Vercel (ne při otevření `kontakt.html` z disku). Lokálně můžeš endpoint otestovat přes Vercel CLI (`vercel dev`) nebo po deployi.

---

## 8. Netlify varianta endpointu

Složka **`netlify/functions/send-contact.js`**:

```javascript
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || 'onboarding@resend.dev';
const TO_EMAIL = process.env.CONTACT_TO_EMAIL || 'info@byhana-reformer.cz';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Neplatný JSON.' }) };
  }

  const { name, email, message } = body;
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Vyplňte jméno, e-mail a zprávu.' }) };
  }

  if (!RESEND_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Chybí RESEND_API_KEY.' }) };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [TO_EMAIL],
        subject: `Kontakt z webu: ${name}`,
        text: `Jméno: ${name}\nE-mail: ${email}\n\nZpráva:\n${message}`,
        reply_to: email,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || response.statusText);
    }

    const data = await response.json();
    return { statusCode: 200, body: JSON.stringify({ success: true, id: data.id }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'E-mail se nepodařilo odeslat.' }) };
  }
};
```

Na Netlify pak voláš např. `/.netlify/functions/send-contact`. V `contact-form.js` změň řádek:

```javascript
const res = await fetch('/.netlify/functions/send-contact', { ... });
```

---

## 9. Shrnutí kroků (checklist)

| Krok | Úkol |
|------|------|
| 1 | Účet Resend, vytvoření API klíče |
| 2 | (Případně) přidat doménu v Resend a nastavit DNS |
| 3 | Vercel nebo Netlify účet, napojení repozitáře |
| 4 | Do projektu přidat `api/send-contact.js` (Vercel) nebo `netlify/functions/send-contact.js` (Netlify) |
| 5 | Nastavit env: `RESEND_API_KEY`, `RESEND_FROM`, `CONTACT_TO_EMAIL` |
| 6 | Do `kontakt.html` přidat HTML formulář (bez změny stávajícího obsahu) |
| 7 | Přidat `js/contact-form.js` a v `kontakt.html` ho načíst |
| 8 | Commit, push, zkontrolovat deploy a otestovat odeslání |

Tím máš kontaktní formulář s Resend na free planu a obsah webu zůstává beze změny.
