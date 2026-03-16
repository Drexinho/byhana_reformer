<?php
/**
 * Kontaktní formulář – odeslání e-mailu přes Resend API.
 * API klíč se bere z resend-config.php (ten vytvoř z resend-config.example.php).
 */
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Povolena je jen metoda POST.']);
    exit;
}

$configFile = __DIR__ . '/resend-config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Chybí konfigurace. Zkopíruj resend-config.example.php na resend-config.php a doplň API klíč.']);
    exit;
}

$config = require $configFile;
$apiKey = $config['api_key'] ?? '';
$from   = $config['from'] ?? 'onboarding@resend.dev';
$fromName = $config['from_name'] ?? 'ByHana REFORMER';
$to     = $config['to'] ?? 'info@byhana-reformer.cz';

if ($apiKey === '' || strpos($apiKey, 're_') !== 0) {
    http_response_code(500);
    echo json_encode(['error' => 'V resend-config.php není platný Resend API klíč.']);
    exit;
}

$token = trim((string) ($_POST['cf-turnstile-response'] ?? ''));
$name    = trim((string) ($_POST['name'] ?? ''));
$email   = trim((string) ($_POST['email'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

if ($name === '' || $email === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Vyplňte jméno, e-mail a zprávu.']);
    exit;
}

$turnstileSecret = $config['turnstile_secret_key'] ?? '';
$turnstileEnabled = $turnstileSecret !== '' && $turnstileSecret !== 'DODAT_TURNSTILE_SECRET_KEY';
if ($turnstileEnabled) {
    $verify = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    curl_setopt_array($verify, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'secret'   => $turnstileSecret,
            'response' => $token,
            'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
        ]),
        CURLOPT_RETURNTRANSFER => true,
    ]);
    $verifyResponse = curl_exec($verify);
    curl_close($verify);
    $verifyData = json_decode($verifyResponse, true);
    if (empty($verifyData['success'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Ověření selhalo. Obnovte stránku a zkuste to znovu.']);
        exit;
    }
} elseif ($turnstileEnabled && $token === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Dokončete ověření (Turnstile).']);
    exit;
}

$body = [
    'from'    => $fromName . ' <' . $from . '>',
    'to'      => [$to],
    'reply_to' => $email,
    'subject' => 'Kontakt z webu: ' . $name,
    'text'    => "Jméno: $name\nE-mail: $email\n\nZpráva:\n$message",
];

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($body),
    CURLOPT_HTTPHEADER     => [
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
