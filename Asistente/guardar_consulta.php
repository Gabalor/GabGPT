<?php
include '../includes/getEnv.php';
// Establecer conexión con la base de datos
$servername = "localhost";
$username = $env['DB_USERNAME'];
$password = $env['DB_PASS'];
$dbname = $env['DB_NAME'];

// Recibir datos del cuerpo de la solicitud
$data = json_decode(file_get_contents('php://input'), true);
$pregunta = $data['pregunta'];
$fecha = $data['fecha'];
if (empty($pregunta)) {
  die("Error en el envio de datos");
}

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
  die("Error de conexión: " . $conn->connect_error);
}

// Consulta SQL para insertar datos en la columna "pregunta"
$sql = "INSERT INTO consultas_gabgpt (pregunta, fecha) VALUES ('$pregunta', '$fecha')"; 

if ($conn->query($sql) === TRUE) {
  echo json_encode(['success' => true, 'message' => 'Datos recibidos correctamente.']);
} else {
  echo "Error al insertar datos: " . $conn->error;
}

// Cerrar la conexión
$conn->close();

?>