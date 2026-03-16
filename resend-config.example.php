<?php
/**
 * Konfigurace pro odesílání e-mailů přes Resend.
 * Přejmenuj tento soubor na resend-config.php a vlož svůj API klíč.
 * Soubor resend-config.php nepřidávej do gitu (klíč zůstane jen na serveru).
 */

return [
    'api_key'   => 're_DODAT_TVUJ_RESEND_API_KLIC',
    'from'      => 'onboarding@resend.dev',
    'from_name' => 'ByHana REFORMER – web',
    'to'        => 'info@byhana-reformer.cz',
    // Cloudflare Turnstile – secret key z dashboardu (pro ověření captcha)
    'turnstile_secret_key' => 'DODAT_TURNSTILE_SECRET_KEY',
];
