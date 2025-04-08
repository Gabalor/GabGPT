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

// SOLO exponer al cliente las variables que realmente necesita
$username = $_ENV['DB_USERNAME'];
$password = $_ENV['DB_PASS'];
$dbname   = $_ENV['DB_NAME'];
$servername = "localhost";

// Recibir datos del cuerpo de la solicitud
$data = json_decode(file_get_contents('php://input'), true);
$pregunta = $data['pregunta'];
$fecha = $data['fecha'];
$ip = $data['ip'];
if (empty($pregunta)) {
  die("Error en el envio de datos");
}

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
  die("Error de conexión: " . $conn->connect_error);
}

// Consulta SQL para insertar datos en la columna "pregunta"
$sql = "INSERT INTO consultas_gabgpt (pregunta, fecha, ip) VALUES ('$pregunta', '$fecha', '$ip')"; 

if ($conn->query($sql) === TRUE) {
echo json_encode(['success' => true, 'message' => 'Datos recibidos correctamente.']);
} else {
  echo "Error al insertar datos: " . $conn->error;
}

// Cerrar la conexión
$conn->close();

?>