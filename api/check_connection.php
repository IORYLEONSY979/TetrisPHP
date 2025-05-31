<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

require_once __DIR__ . '/Database.php';

try {
    $db = new Database();
    
    // Prueba adicional de consulta
    $testQuery = $db->getTopScores();
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Conexión exitosa a la base de datos',
        'database' => 'tetris_db',
        'test_query' => count($testQuery) > 0 ? 'success' : 'empty_result',
        'server_info' => [
            'php_version' => phpversion(),
            'server_software' => $_SERVER['SERVER_SOFTWARE']
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'connection_error' => true,
        'suggestions' => [
            'Verifique que el servidor MySQL esté en ejecución',
            'Confirme las credenciales de conexión',
            'Valide que la base de datos tetris_db exista'
        ]
    ]);
}
?>