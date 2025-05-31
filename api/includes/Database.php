<?php
class Database {
    private $host = 'localhost';
    private $user = 'root';
    private $password = ''; // Si tienes una contraseña para 'root', ponla aquí
    private a $database = 'tetris_db';
    private $connection;
    
    public function __construct() {
        $this->connect();
    }
    
    private function connect() {
        // Habilita el reporte de errores para que mysqli lance excepciones
        mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
        
        try {
            $this->connection = new mysqli($this.host, $this->user, $this->password, $this->database);
            $this->connection->set_charset("utf8mb4");
        } catch (mysqli_sql_exception $e) {
            // Lanza una excepción más general para ser atrapada por los scripts de la API
            throw new Exception("Error de conexión a la base de datos: " . $e->getMessage());
        }
    }
    
    public function saveScore($name, $score, $level, $line) {
        $name = $this->sanitizeInput($name, 50);
        $score = (int)$score;
        $level = (int)$level;
        $line = (int)$line;
        
        $stmt = $this->connection->prepare("INSERT INTO scores (name, score, level, line) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("siii", $name, $score, $level, $line);
        
        if (!$stmt->execute()) {
            throw new Exception("Error al guardar puntaje: " . $stmt->error);
        }
        
        $stmt->close();
        return true;
    }
    
    public function getTopScores() {
        $result = $this->connection->query(
            "SELECT name, score, level, line, 
             DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') as date 
             FROM scores ORDER BY score DESC LIMIT 10"
        );
        
        $scores = [];
        while ($row = $result->fetch_assoc()) {
            $scores[] = $row;
        }
        
        return $scores;
    }
    
    private function sanitizeInput($input, $maxLength) {
        $input = trim($input);
        $input = stripslashes($input);
        $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
        return substr($input, 0, $maxLength);
    }
    
    public function close() {
        if ($this->connection) {
            $this->connection->close();
        }
    }
    
    public function __destruct() {
        $this->close();
    }
}
?>