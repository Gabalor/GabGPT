<?php
// 🔒 Verificar que la solicitud venga desde tu dominio
$allowed_origin = 'http://localhost';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin !== $allowed_origin) {
    header('HTTP/1.1 403 Forbidden');
    exit('Origen no autorizado');
}

// Protección opcional contra acceso directo
if ($_SERVER['REQUEST_METHOD'] !== 'POST' && !isset($_SERVER['HTTP_X_REQUESTED_WITH'])) {
    header('HTTP/1.1 403 Forbidden');
    exit('Acceso denegado');
}

// Cargar variables de entorno desde el archivo de configuración
require_once $_SERVER['DOCUMENT_ROOT'] . '/GabGPT/config.php';

$input = json_decode(file_get_contents('php://input'), true);

// Validar entrada
if (!isset($input['messages']) || !is_array($input['messages'])) {
    header('HTTP/1.1 400 Bad Request');
    echo json_encode(['error' => 'Mensajes inválidos.']);
    exit;
}

// Preparar la solicitud a la API de Groq
$apiUrl = API_URL;
$token = TOKEN;

$body = [
    'messages' => $input['messages'],
    'model' => 'meta-llama/llama-4-scout-17b-16e-instruct'
];

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    "Authorization: Bearer $token"
]);

// ⚠️ Solo para desarrollo local (NO usar en producción)
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
//  *****************************************************

curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    echo json_encode(['error' => 'Error en cURL: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}
curl_close($ch);

// Devolver respuesta de la API
http_response_code($httpcode);
header('Content-Type: application/json');
echo $response;
?>