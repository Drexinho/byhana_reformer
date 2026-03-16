/**
 * Odeslání kontaktního formuláře na send-email.php (PHP + Resend).
 * Frontend zůstává stejný – jen zachytí submit a zobrazí stav.
 */
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
    statusEl.textContent = '';
    statusEl.className = 'text-sm min-h-[1.25rem]';

    try {
      const formData = new FormData(form);
      const res = await fetch(form.action, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(function () { return {}; });

      if (res.ok && data.success) {
        statusEl.textContent = 'Zpráva byla odeslána. Brzy vás budeme kontaktovat.';
        statusEl.classList.add('text-brown-700');
        form.reset();
      } else {
        statusEl.textContent = data.error || 'Něco se pokazilo. Zkuste to později nebo napište na info@byhana-reformer.cz.';
        statusEl.classList.add('text-brown-800');
      }
    } catch (err) {
      statusEl.textContent = 'Chyba připojení. Zkuste to později.';
      statusEl.classList.add('text-brown-800');
    } finally {
      btn.disabled = false;
      btn.textContent = origText;
    }
  });
});
