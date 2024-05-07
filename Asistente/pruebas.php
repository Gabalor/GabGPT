<?php
// URL de la API
$url = 'https://api.ip2location.io/?key=9F59FFA9F4398F5F4222D4F8D08DD209&format=json';

// Obtener el contenido JSON de la URL
$json = file_get_contents($url);

// Decodificar el JSON en un array asociativo
$data = json_decode($json, true);

// Verificar si la decodificación fue exitosa
if ($data === null) {
    // Manejar el error si la decodificación falló
    echo "Error al decodificar el JSON";
} else {
    // Acceder a los datos según la estructura del JSON
    echo "IP: " . $data['ip'] . "<br>";
    echo "País: " . $data['country_name'] . "<br>";
    echo "Región: " . $data['region_name'] . "<br>";
    // y así sucesivamente...
}
?>
