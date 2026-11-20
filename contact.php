<?php
declare(strict_types=1);

ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, bool $ok): void
{
    http_response_code($status);
    echo json_encode(['ok' => $ok]);
    exit;
}

function readAssignment(string $file, string $prefix): array
{
    $source = file_get_contents(__DIR__ . '/' . $file);
    if ($source === false) {
        throw new RuntimeException('Configuration file unavailable');
    }
    $source = trim(preg_replace('/^\xEF\xBB\xBF/', '', $source));
    if (strpos($source, $prefix) !== 0) {
        throw new RuntimeException('Invalid configuration');
    }
    $value = json_decode(rtrim(trim(substr($source, strlen($prefix))), ';'), true, 512, JSON_THROW_ON_ERROR);
    if (!is_array($value)) {
        throw new RuntimeException('Configuration must contain JSON data');
    }
    return $value;
}

function field(string $name, int $limit): string
{
    $value = $_POST[$name] ?? '';
    if (!is_string($value) || strlen($value) > $limit || strpos($value, "\0") !== false
        || !preg_match('//u', $value)) {
        respond(422, false);
    }
    return trim($value);
}

function mailSettings(): array
{

    $settings = [
        'transport' => 'auto',
        'from' => '',
        'brevo_api_key' => '',
        'smtp_host' => '',
        'smtp_port' => 587,
        'smtp_encryption' => 'auto',
        'smtp_username' => '',
        'smtp_password' => '',
    ];
    $variables = [
        'transport' => 'MAIL_TRANSPORT', 'from' => 'MAIL_FROM',
        'brevo_api_key' => 'BREVO_API_KEY', 'smtp_host' => 'SMTP_HOST',
        'smtp_port' => 'SMTP_PORT', 'smtp_encryption' => 'SMTP_ENCRYPTION',
        'smtp_username' => 'SMTP_USERNAME', 'smtp_password' => 'SMTP_PASSWORD',
    ];
    foreach ($variables as $key => $variable) {
        $value = getenv($variable);
        if ($value !== false && $value !== '') {
            $settings[$key] = $value;
        }
    }
    foreach ($settings as $key => $value) {
        if (!is_string($value) && !($key === 'smtp_port' && is_int($value))) {
            throw new RuntimeException('Invalid mail setting type');
        }
    }
    if ($settings['transport'] === 'auto') {
        $settings['transport'] = $settings['brevo_api_key'] !== '' ? 'brevo'
            : ($settings['smtp_host'] !== '' ? 'smtp' : '');
    }
    if (!in_array($settings['transport'], ['brevo', 'smtp', 'mail'], true)) {
        throw new RuntimeException('Configure Brevo HTTPS API or SMTP before accepting enquiries');
    }
    $settings['from'] = trim($settings['from']);
    if (!validMailAddress($settings['from'])) {
        throw new RuntimeException('Configure an authorised MAIL_FROM address');
    }
    return $settings;
}

function validMailAddress(string $address): bool
{
    return strlen($address) <= 254 && (bool) filter_var($address, FILTER_VALIDATE_EMAIL)
        && !preg_match('/[\r\n\x00]/', $address) && !preg_match('/\.(example|invalid|test)$/i', $address);
}

function smtpWrite($stream, string $data): void
{
    $length = strlen($data);
    for ($offset = 0; $offset < $length; $offset += $written) {
        $written = fwrite($stream, substr($data, $offset));
        if ($written === false || $written === 0) {
            throw new RuntimeException('SMTP write failed or timed out');
        }
    }
}

function expectReply($stream, array $codes): void
{
    $code = null;
    for ($count = 0; $count < 100; $count++) {
        $line = fgets($stream, 2048);
        if ($line === false || !preg_match('/^(\d{3})([ -])[^\r\n]*\r\n$/D', $line, $match)
            || ($code !== null && $code !== (int) $match[1])) {
            throw new RuntimeException('SMTP reply invalid, connection closed or timed out');
        }
        $code = (int) $match[1];
        if ($match[2] === ' ') {
            if (!in_array($code, $codes, true)) {

                throw new RuntimeException('SMTP rejected request with status ' . $code);
            }
            return;
        }
    }
    throw new RuntimeException('SMTP reply too long');
}

function smtpCommand($stream, string $command, array $codes): void
{
    smtpWrite($stream, $command . "\r\n");
    expectReply($stream, $codes);
}

function deliverBrevo(array $settings, string $to, string $reply, string $body): bool
{
    $key = $settings['brevo_api_key'];
    if ($key === '' || preg_match('/[\r\n\x00]/', $key) || !function_exists('curl_init')) {
        throw new RuntimeException('Brevo needs an API key and PHP cURL');
    }
    $payload = json_encode([
        'sender' => ['email' => $settings['from']],
        'to' => [['email' => $to]],
        'replyTo' => ['email' => $reply],
        'subject' => 'New studio enquiry',
        'textContent' => $body,
    ], JSON_THROW_ON_ERROR);
    $handle = curl_init('https://api.brevo.com/v3/smtp/email');
    if ($handle === false) {
        throw new RuntimeException('Cannot initialise mail API');
    }
    try {
        curl_setopt_array($handle, [
            CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['accept: application/json', 'content-type: application/json', 'api-key: ' . $key],
            CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_TIMEOUT => 25,
            CURLOPT_SSL_VERIFYPEER => true, CURLOPT_SSL_VERIFYHOST => 2,
        ]);
        $response = curl_exec($handle);
        $status = (int) curl_getinfo($handle, CURLINFO_HTTP_CODE);
        if ($response === false) {
            throw new RuntimeException('Mail API connection failed (cURL ' . curl_errno($handle) . ')');
        }
        $result = json_decode($response, true);
        if ($status !== 201 || !is_array($result) || !isset($result['messageId'])
            || !is_string($result['messageId']) || $result['messageId'] === '') {
            throw new RuntimeException('Mail API did not accept message (HTTP ' . $status . ')');
        }
        return true;
    } finally {

        unset($handle);
    }
}

function deliverSmtp(array $settings, string $to, array $headers, string $body): bool
{
    $host = $settings['smtp_host'];
    $port = filter_var($settings['smtp_port'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 65535]]);
    $mode = $settings['smtp_encryption'];
    if ($mode === 'auto') {
        $mode = $port === 465 ? 'tls' : 'starttls';
    }
    if (!$port || !in_array($mode, ['tls', 'starttls'], true)
        || !preg_match('/^[a-zA-Z0-9.-]+$/D', $host) || !extension_loaded('openssl')) {
        throw new RuntimeException('Invalid SMTP host, port, encryption or missing OpenSSL');
    }
    if ($settings['smtp_username'] === '' || $settings['smtp_password'] === '') {
        throw new RuntimeException('SMTP requires username and password');
    }
    $context = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $host]]);
    $stream = @stream_socket_client(($mode === 'tls' ? 'tls://' : 'tcp://') . $host . ':' . $port, $errno, $error, 8, STREAM_CLIENT_CONNECT, $context);
    if (!$stream) {
        throw new RuntimeException('SMTP connection failed (check provider port restrictions)');
    }
    try {
        stream_set_timeout($stream, 12);
        expectReply($stream, [220]);
        $hello = 'EHLO ' . substr(strrchr($settings['from'], '@'), 1);
        smtpCommand($stream, $hello, [250]);
        if ($mode === 'starttls') {
            smtpCommand($stream, 'STARTTLS', [220]);
            if (!stream_socket_enable_crypto($stream, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('SMTP TLS negotiation failed');
            }
            smtpCommand($stream, $hello, [250]);
        }
        smtpCommand($stream, 'AUTH LOGIN', [334]);
        smtpCommand($stream, base64_encode($settings['smtp_username']), [334]);
        smtpCommand($stream, base64_encode($settings['smtp_password']), [235]);
        smtpCommand($stream, 'MAIL FROM:<' . $settings['from'] . '>', [250]);
        smtpCommand($stream, 'RCPT TO:<' . $to . '>', [250, 251]);
        smtpCommand($stream, 'DATA', [354]);
        $lines = [];
        foreach ($headers as $label => $value) {
            $lines[] = $label . ': ' . $value;
        }
        smtpCommand($stream, implode("\r\n", $lines) . "\r\n\r\n" . $body . '.', [250]);

        @fwrite($stream, "QUIT\r\n");
        return true;
    } finally {
        fclose($stream);
    }
}

function deliver(string $to, string $reply, string $body): bool
{
    $settings = mailSettings();
    if ($settings['transport'] === 'brevo') {
        return deliverBrevo($settings, $to, $reply, $body);
    }
    $headers = [
        'From' => $settings['from'], 'Reply-To' => $reply,
        'MIME-Version' => '1.0', 'Content-Type' => 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding' => 'base64', 'Date' => date(DATE_RFC2822),
        'Message-ID' => '<' . bin2hex(random_bytes(12)) . '@' . substr(strrchr($settings['from'], '@'), 1) . '>',
    ];
    $encodedBody = chunk_split(base64_encode($body), 76, "\r\n");
    if ($settings['transport'] === 'mail') {
        if (!function_exists('mail') || !mail($to, 'New studio enquiry', $encodedBody, $headers)) {
            throw new RuntimeException('Local mail transport did not accept message');
        }
        return true;
    }
    $headers['To'] = $to;
    $headers['Subject'] = 'New studio enquiry';
    return deliverSmtp($settings, $to, $headers, $encodedBody);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, false);
}

try {
    $cfg = readAssignment('config/config.js', 'window.SITE_CONFIG =');
    $catalogue = readAssignment('js/products.js', 'window.PRODUCTS =');
    if (!isset($cfg['form']['subjects'], $cfg['company'], $cfg['email'])
        || !is_array($cfg['form']['subjects']) || !is_string($cfg['company']) || !is_string($cfg['email'])) {
        throw new RuntimeException('Invalid site form configuration');
    }
    $name = field('name', 400);
    $reply = field('email', 254);
    $subject = field('subject', 128);
    $message = field('message', 16000);
    if ($name === '' || !filter_var($reply, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $reply)
        || !in_array($subject, $cfg['form']['subjects'], true) || field('consent', 8) !== 'on' || field('website', 250) !== '') {
        respond(422, false);
    }
    $rawItems = field('items', 2048);

    $itemsObject = json_decode($rawItems === '' ? '{}' : $rawItems);
    if (!is_object($itemsObject)) {
        respond(422, false);
    }
    $items = (array) $itemsObject;
    if (count($items) > count($catalogue)) {
        respond(422, false);
    }
    $body = $cfg['company'] . "\n\nName: " . $name . "\nEmail: " . $reply . "\nTopic: " . $subject . "\n\n" . $message;
    if ($items) {
        if ($subject !== 'Order request') {
            respond(422, false);
        }
        $byId = array_column($catalogue, null, 'id');
        $total = 0;
        $body .= "\n\nSelected pieces:\n";
        foreach ($items as $id => $qty) {
            if (!isset($byId[$id]) || !is_int($qty) || $qty < 1 || $qty > 99) {
                respond(422, false);
            }
            $p = $byId[$id];
            $lineTotal = $p['price'] * $qty;
            $total += $lineTotal;
            $body .= $p['name'] . ' | ' . $p['size'] . ' | qty ' . $qty . ' | USD ' . $lineTotal . "\n";
        }
        $body .= 'Subtotal: USD ' . $total;
    } elseif ($message === '') {
        respond(422, false);
    }
    $recipient = trim($cfg['email']);
    if (!validMailAddress($recipient)) {
        throw new RuntimeException('Set a real recipient in SITE_CONFIG.email');
    }
    $accepted = deliver($recipient, $reply, $body);
    respond($accepted ? 200 : 503, $accepted);
} catch (Throwable $error) {

    error_log('[contact] ' . $error->getMessage());
    respond(503, false);
}
