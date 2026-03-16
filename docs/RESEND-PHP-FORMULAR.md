# Resend + PHP kontaktní formulář (API klíč na serveru)

API klíč můžeš mít v PHP – **PHP běží na serveru**, takže klíč nikdy neodejde do prohlížeče a je v bezpečí.

---

## 1. Co potřebuješ

- Hosting s **PHP** (např. Wedos, Forpsi, endora, cokoliv s PHP).
- Účet **Resend**, API klíč (v Resend: API Keys → Create API Key).

---

## 2. Struktura na serveru

Na serveru budeš mít např.:

```
/
├── index.html
├── kontakt.html          # formulář bude posílat na send-email.php
├── send-email.php        # tento soubor obsahuje API klíč a volá Resend
└── ...
```

**Důležité:** Soubor s API klíčem (`send-email.php` nebo config) **nastav tak, aby byl mimo veřejnou složku**, nebo aspoň tak, aby se nikdy neposílal klientovi. Ideálně:

- API klíč ulož do souboru **mimo webroot**, např. `/home/user/config/resend-key.php` (jen `<?php return 're_xxx'; ?>`), a v `send-email.php` ho načti přes `require` nebo `file_get_contents`.
- Nebo ho měj v `send-email.php` nahoře – na většině hostingu se `.php` soubory vykonávají, takže zdrojový kód klient nevidí. Jen nikdy nedávej klíč do `.js` nebo do HTML.

---

## 3. Soubor `send-email.php`

Formulář z kontaktní stránky bude posílat POST na tento skript. Skript ověří data, zavolá Resend API a vrátí JSON.

```php
<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // pokud formulář je na jiné doméně; jinak můžeš smazat
header('Access-Control-Allow-Method: POST');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Povolena je jen metoda POST.']);
    exit;
}

// API klíč – ideálně z config souboru mimo webroot, nebo env
$apiKey = getenv('RESEND_API_KEY') ?: 're_TADY_TVUJ_KLIC';

// Kam chodí e-maily z formuláře
$toEmail = 'info@byhana-reformer.cz';
// Odesílatel (na free planu bez vlastní domény můžeš použít onboarding@resend.dev)
$fromEmail = 'onboarding@resend.dev';
$fromName = 'ByHana REFORMER – web';

$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['email'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Vyplňte jméno, e-mail a zprávu.']);
    exit;
}

// Volání Resend API
$body = [
    'from' => $fromName . ' <' . $fromEmail . '>',
    'to' => [$toEmail],
    'reply_to' => $email,
    'subject' => 'Kontakt z webu: ' . $name,
    'text' => "Jméno: $name\nE-mail: $email\n\nZpráva:\n$message",
];

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($body),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ],
    CURLOPT_RETURNTRANSFER => true,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);

if ($httpCode >= 200 && $httpCode < 300) {
    echo json_encode(['success' => true, 'id' => $data['id'] ?? null]);
} else {
    http_response_code(500);
    echo json_encode(['error' => $data['message'] ?? 'E-mail se nepodařilo odeslat.']);
}
```

- Místo `'re_TADY_TVUJ_KLIC'` dej svůj klíč z Resend, nebo lépe načti z configu/env (viz výše).
- `$toEmail` a `$fromEmail` si uprav podle sebe (po ověření domény v Resend můžeš posílat z `kontakt@tvoje-domena.cz`).

---

## 4. HTML formulář (např. v `kontakt.html`)

Formulář pošle data metodou POST na `send-email.php`. Aby se stránka neobnovila a uživatel viděl úspěch/chybu, můžeš použít JavaScript (fetch).

```html
<form id="contact-form" action="send-email.php" method="post" class="...">
  <input type="text" name="name" required placeholder="Jméno">
  <input type="email" name="email" required placeholder="E-mail">
  <textarea name="message" required placeholder="Zpráva"></textarea>
  <button type="submit">Odeslat</button>
  <p id="form-status"></p>
</form>

<script>
document.getElementById('contact-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const status = document.getElementById('form-status');
  const btn = form.querySelector('button[type="submit"]');

  btn.disabled = true;
  btn.textContent = 'Odesílám…';
  status.textContent = '';

  try {
    const res = await fetch(form.action, { method: 'POST', body: fd });
    const data = await res.json();
    if (res.ok && data.success) {
      status.textContent = 'Zpráva odeslána. Brzy vás budeme kontaktovat.';
      status.style.color = 'green';
      form.reset();
    } else {
      status.textContent = data.error || 'Něco se pokazilo.';
      status.style.color = 'red';
    }
  } catch (err) {
    status.textContent = 'Chyba připojení. Zkuste to později.';
    status.style.color = 'red';
  }
  btn.disabled = false;
  btn.textContent = 'Odeslat';
});
</script>
```

- `action="send-email.php"` – pokud je `send-email.php` ve stejné složce jako `kontakt.html`. Jinak napiš cestu (např. `"/send-email.php"` nebo `"/api/send-email.php"`).

---

## 5. Proč tady API klíč v PHP nevadí

| Kde běží kód      | Kde je klíč        | Vidí ho návštěvník? |
|-------------------|--------------------|----------------------|
| **PHP na serveru**| V `send-email.php` | Ne – prohlížeč dostane jen odpověď (JSON). |
| **JavaScript v prohlížeči** | V .js nebo HTML | Ano – v DevTools → šlo by zneužít. |

Proto: **API klíč patří do PHP (nebo jiného serverového kódu), ne do JavaScriptu.**  
S čistě PHP formulářem a Resend tedy můžeš mít API klíč v jednom PHP souboru (nebo v configu na serveru) a je to v pořádku.
