<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once __DIR__ . '/Database.php';

$data = json_decode(file_get_contents('php://input'), true);

if ($data === null || !isset($data['name'], $data['score'], $data['level'], $data['line'])) {
    echo json_encode([
        'status' => 'error', 
        'message' => 'Datos inválidos',
        'required_fields' => ['name', 'score', 'level', 'line']
    ]);
    exit;
}

try {
    $db = new Database();
    $db->saveScore($data['name'], $data['score'], $data['level'], $data['line']);
    echo json_encode([
        'status' => 'success', 
        'message' => 'Puntaje guardado correctamente'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error', 
        'message' => $e->getMessage(),
        'error_code' => $e->getCode()
    ]);
}
?>