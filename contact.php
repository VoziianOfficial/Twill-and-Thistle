<?php
declare(strict_types=1);

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
    $source = trim((string) file_get_contents(__DIR__ . '/' . $file));
    if (strpos($source, $prefix) !== 0) {
        throw new RuntimeException('Invalid configuration');
    }
    return json_decode(rtrim(trim(substr($source, strlen($prefix))), ';'), true, 512, JSON_THROW_ON_ERROR);
}

function field(string $name, int $limit): string
{
    $value = $_POST[$name] ?? '';
    if (!is_string($value) || strlen($value) > $limit || strpos($value, "\0") !== false) {
        respond(422, false);
    }
    return trim($value);
}

function expectReply($stream, array $codes): void
{
    do {
        $line = fgets($stream, 2048);
        if ($line === false || strlen($line) < 4) {
            throw new RuntimeException('Mail connection closed');
        }
    } while ($line[3] === '-');
    if (!in_array((int) substr($line, 0, 3), $codes, true)) {
        throw new RuntimeException('Mail server declined request');
    }
}

function smtpCommand($stream, string $command, array $codes): void
{
    if (fwrite($stream, $command . "\r\n") === false) {
        throw new RuntimeException('Mail connection failed');
    }
    expectReply($stream, $codes);
}

function deliver(string $to, string $from, string $reply, string $body): bool
{
    $headers = [
        'From' => $from,
        'Reply-To' => $reply,
        'MIME-Version' => '1.0',
        'Content-Type' => 'text/plain; charset=UTF-8',
        'Content-Transfer-Encoding' => 'base64'
    ];
    $body = chunk_split(base64_encode($body), 76, "\r\n");
    $subject = 'New studio enquiry';
    $host = getenv('SMTP_HOST');
    if (!$host) {
        return function_exists('mail') && mail($to, $subject, $body, $headers);
    }
    $port = (int) (getenv('SMTP_PORT') ?: 587);
    $mode = getenv('SMTP_ENCRYPTION') ?: ($port === 465 ? 'tls' : 'starttls');
    if (!in_array($mode, ['tls', 'starttls'], true) || !preg_match('/^[a-zA-Z0-9.-]+$/D', $host)) {
        throw new RuntimeException('Invalid mail configuration');
    }
    $context = stream_context_create(['ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'peer_name' => $host]]);
    $stream = stream_socket_client(($mode === 'tls' ? 'tls://' : 'tcp://') . $host . ':' . $port, $errno, $error, 8, STREAM_CLIENT_CONNECT, $context);
    if (!$stream) {
        throw new RuntimeException('Mail service unavailable');
    }
    try {
        stream_set_timeout($stream, 12);
        expectReply($stream, [220]);
        $hello = 'EHLO ' . substr(strrchr($from, '@'), 1);
        smtpCommand($stream, $hello, [250]);
        if ($mode === 'starttls') {
            smtpCommand($stream, 'STARTTLS', [220]);
            if (!stream_socket_enable_crypto($stream, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('Mail TLS unavailable');
            }
            smtpCommand($stream, $hello, [250]);
        }
        $username = getenv('SMTP_USERNAME');
        if ($username !== false && $username !== '') {
            smtpCommand($stream, 'AUTH LOGIN', [334]);
            smtpCommand($stream, base64_encode($username), [334]);
            smtpCommand($stream, base64_encode((string) getenv('SMTP_PASSWORD')), [235]);
        }
        smtpCommand($stream, 'MAIL FROM:<' . $from . '>', [250]);
        smtpCommand($stream, 'RCPT TO:<' . $to . '>', [250, 251]);
        smtpCommand($stream, 'DATA', [354]);
        $headers['To'] = $to;
        $headers['Subject'] = $subject;
        $headers['Date'] = date(DATE_RFC2822);
        $headers['Message-ID'] = '<' . bin2hex(random_bytes(12)) . '@' . substr(strrchr($from, '@'), 1) . '>';
        $lines = [];
        foreach ($headers as $label => $value) {
            $lines[] = $label . ': ' . $value;
        }
        smtpCommand($stream, implode("\r\n", $lines) . "\r\n\r\n" . $body . '.', [250]);
        return true;
    } finally {
        fclose($stream);
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, false);
}

try {
    $cfg = readAssignment('config/config.js', 'window.SITE_CONFIG =');
    $catalogue = readAssignment('js/products.js', 'window.PRODUCTS =');
    $name = field('name', 400);
    $reply = field('email', 254);
    $subject = field('subject', 128);
    $message = field('message', 16000);
    if ($name === '' || !filter_var($reply, FILTER_VALIDATE_EMAIL) || preg_match('/[\r\n]/', $reply)
        || !in_array($subject, $cfg['form']['subjects'], true) || field('consent', 8) !== 'on' || field('website', 250) !== '') {
        respond(422, false);
    }
    $items = json_decode(field('items', 2048) ?: '{}', true);
    if (!is_array($items) || count($items) > count($catalogue)) {
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
    $recipient = $cfg['email'];
    $sender = getenv('MAIL_FROM') ?: $recipient;
    if (!filter_var($recipient, FILTER_VALIDATE_EMAIL) || !filter_var($sender, FILTER_VALIDATE_EMAIL)
        || preg_match('/[\r\n]/', $recipient . $sender) || preg_match('/\.example$/i', $recipient)) {
        respond(503, false);
    }
    $accepted = deliver($recipient, $sender, $reply, $body);
    respond($accepted ? 200 : 503, $accepted);
} catch (Throwable $error) {
    respond(503, false);
}
