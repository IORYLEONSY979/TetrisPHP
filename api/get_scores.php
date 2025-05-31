<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

require_once __DIR__ . '/Database.php';

try {
    $db = new Database();
    $scores = $db->getTopScores();
    
    echo json_encode([
        'status' => 'success',
        'data' => $scores,
        'count' => count($scores),
        'last_updated' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'fallback' => true,
        'alternative_data' => []
    ]);
}
?>