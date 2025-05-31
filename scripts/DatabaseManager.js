class DatabaseManager {
    constructor() {
        this.dbConnected = false;
        this.connectionChecked = false;
    }

    async initialize() {
        // Si ya hemos verificado la conexión, no lo hagas de nuevo.
        if (this.connectionChecked) {
            return this.dbConnected;
        }

        try {
            const response = await fetch('api/check_connection.php', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                cache: 'no-cache'
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            this.dbConnected = data.status === 'success';
            this.connectionChecked = true;
            
            console.log("DatabaseManager initialized", {
                connected: this.dbConnected,
                details: data
            });
            
            return this.dbConnected;
        } catch (error) {
            console.error("DatabaseManager initialization failed:", error);
            this.dbConnected = false;
            this.connectionChecked = true;
            return false;
        }
    }

    async saveScore(name, score, level, line) {
        // Validación de datos
        if (typeof name !== 'string' || name.trim().length === 0 || name.length > 50) {
            console.error("Invalid name parameter");
            return false;
        }

        if (typeof score !== 'number' || typeof level !== 'number' || typeof line !== 'number') {
            console.error("Invalid numeric parameters");
            return false;
        }

        const scoreData = {
            name: name.trim().substring(0, 50),
            score: Math.max(0, Math.floor(score)),
            level: Math.max(1, Math.floor(level)),
            line: Math.max(0, Math.floor(line)),
            timestamp: new Date().toISOString()
        };

        // Asegurarse de que la conexión está inicializada antes de intentar guardar
        await this.initialize();
        if (this.dbConnected) {
            try {
                const response = await fetch('api/save_score.php', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(scoreData),
                    cache: 'no-cache'
                });

                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

                const result = await response.json();
                if (result.status === 'success') {
                    console.log("Score saved to server database");
                    return true;
                }
            } catch (error) {
                console.error("Failed to save to server:", error);
                this.dbConnected = false; // Marcar como desconectado si falla
            }
        }

        // Fallback a localStorage si la conexión falló o no estaba disponible
        try {
            const storedScores = JSON.parse(localStorage.getItem('tetris_scores') || '[]');
            
            // Limitar a 100 puntajes máximos
            const updatedScores = [...storedScores, scoreData]
                .sort((a, b) => b.score - a.score)
                .slice(0, 100);
                
            localStorage.setItem('tetris_scores', JSON.stringify(updatedScores));
            console.log("Score saved to localStorage");
            return true;
        } catch (error) {
            console.error("Failed to save to localStorage:", error);
            return false;
        }
    }

    async getTopScores(limit = 10) {
        // Asegurarse de que la conexión está inicializada
        await this.initialize();
        if (this.dbConnected) {
            try {
                const response = await fetch(`api/get_scores.php`, {
                    cache: 'no-cache'
                });

                if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

                const result = await response.json();
                if (result.status === 'success') {
                    // Actualizar localStorage como caché
                    try {
                        localStorage.setItem('tetris_scores_cache', JSON.stringify({
                            data: result.data,
                            timestamp: new Date().toISOString()
                        }));
                    } catch (e) {
                        console.warn("Could not update localStorage cache:", e);
                    }
                    
                    return result.data.slice(0, limit);
                }
            } catch (error) {
                console.error("Failed to fetch from server:", error);
                this.dbConnected = false; // Marcar como desconectado si falla
            }
        }

        // Fallback a localStorage
        try {
            // Primero intentar con caché reciente
            const cached = JSON.parse(localStorage.getItem('tetris_scores_cache') || 'null');
            if (cached && cached.data) {
                return cached.data.slice(0, limit);
            }
            
            // Luego con datos guardados localmente
            const localScores = JSON.parse(localStorage.getItem('tetris_scores') || '[]');
            return localScores.slice(0, limit);
        } catch (error) {
            console.error("Failed to read from localStorage:", error);
            return [];
        }
    }

    async checkConnection() {
        return this.initialize();
    }
}