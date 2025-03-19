<?php
// Permitir CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Se for uma requisição OPTIONS (preflight), apenas retornar os headers
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Obter o caminho da API a partir da URL
$path = $_GET['path'] ?? '';
if (empty($path)) {
    http_response_code(400);
    echo json_encode(['error' => 'Caminho da API não fornecido']);
    exit();
}

// Obter parâmetros de consulta (exceto 'path')
$queryParams = $_GET;
unset($queryParams['path']);
$queryString = !empty($queryParams) ? '?' . http_build_query($queryParams) : '';

// Construir URL completa da API
$apiUrl = "https://api.shiftgroup.com.br/api/{$path}{$queryString}";

// Obter headers da requisição
$headers = getallheaders();
$apiHeaders = [
    'Content-Type: application/json',
    'Accept: application/json'
];

// Adicionar token de autorização, se disponível
if (isset($headers['Authorization'])) {
    $apiHeaders[] = 'Authorization: ' . $headers['Authorization'];
}

// Configurar cURL
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);
curl_setopt($ch, CURLOPT_HTTPHEADER, $apiHeaders);

// Adicionar corpo da requisição, se necessário
if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'HEAD') {
    $requestBody = file_get_contents('php://input');
    if (!empty($requestBody)) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $requestBody);
    }
}

// Executar requisição
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

// Definir status HTTP e tipo de conteúdo
http_response_code($httpCode);
if ($contentType) {
    header("Content-Type: $contentType");
}

// Retornar resposta
echo $response;
?> 