class TetrisGame {
    constructor() {
        // Elementos del DOM
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.levelElement = document.getElementById('level');
        this.lineElement = document.getElementById('line');
        this.systemStatus = document.getElementById('systemStatus');
        this.dbStatus = document.getElementById('dbStatus');
        this.consoleOutput = document.getElementById('consoleOutput');
        this.scoresList = document.getElementById('scoresList');
        this.musicButton = document.getElementById('toggleMusic');
        this.gamepadControls = document.getElementById('gamepadControls');
        
        // Configuración del juego
        this.blockSize = 30;
        this.rows = 20;
        this.cols = 10;
        this.score = 0;
        this.level = 1;
        this.line = 0;
        this.gameOver = false;
        this.lastTimestamp = 0;
        this.lastFps = 0;
        this.dropSpeed = 1000;
        this.lastDrop = 0;
        
        // Control de inputs
        this.lastInputTime = 0;
        this.inputDelay = 100;
        this.lastMove = { left: 0, right: 0, down: 0, rotate: 0 };
        
        // Estado del juego
        this.board = this.createBoard();
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        
        // Sistema de base de datos
        this.database = new DatabaseManager();
        
        // Sistema de sonido
        this.sounds = {
            lineclear: new Audio('assets/sounds/lineclear.wav'),
            levelup: new Audio('assets/sounds/levelup.wav'),
            gameover: new Audio('assets/sounds/gameover.wav'),
            move: new Audio('assets/sounds/move.wav'),
            rotate: new Audio('assets/sounds/rotate.wav'),
            drop: new Audio('assets/sounds/drop.wav'),
            music: [
                new Audio('assets/sounds/level1.mp3'),
                new Audio('assets/sounds/level2.mp3'),
                new Audio('assets/sounds/level3.mp3'),
                new Audio('assets/sounds/level4.mp3')
            ]
        };
        
        // Configuración de audio
        this.currentMusic = null;
        this.musicEnabled = true;
        this.musicFadeInterval = null;
        this.musicWasPlaying = false;
        this.audioActivated = false;
        
        // Gamepad
        this.gamepadConnected = false;
        this.gamepadIndex = null;
        
        // Mostrar pantalla de inicio
        this.showIntro();
        this.setupControls();
    }

    showIntro() {
        // Ocultar el juego durante la intro
        document.querySelector('.game-container').style.display = 'none';
        
        // Simular carga
        setTimeout(() => {
            document.querySelector('.intro-overlay').style.opacity = '0';
            setTimeout(() => {
                document.querySelector('.intro-overlay').style.display = 'none';
                document.querySelector('.game-container').style.display = 'block';
                this.log("✅ Juego cargado correctamente");
                this.init();
            }, 500);
        }, 3000);
    }

    async init() {
        this.log("Inicializando juego...");
        this.updateStatus();
        
        try {
            const isConnected = await this.database.initialize();
            this.updateDbStatus(isConnected);

            const scores = await this.database.getTopScores();
            this.displayScores(scores);
            
            this.setupAudio();
            this.setupGamepad();
            
            this.log("✅ Juego inicializado correctamente");
            this.gameLoop();
        } catch (error) {
            this.log(`❌ Error inicializando: ${error.message}`, 'error');
            this.showFatalError();
        }
    }

    setupControls() {
        document.addEventListener('keydown', (e) => this.handleInput(e));
        this.musicButton.addEventListener('click', () => this.toggleMusic());
        this.setupTouchControls();
        
        if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            const audioActivationDiv = document.createElement('div');
            audioActivationDiv.className = 'audio-activation';
            audioActivationDiv.innerHTML = `<p>Toca para activar el audio</p>`;
            document.body.appendChild(audioActivationDiv);
            
            const activateAudio = () => {
                this.audioActivated = true;
                audioActivationDiv.remove();
                if (this.musicEnabled) {
                    this.playLevelMusic();
                }
                document.body.removeEventListener('click', activateAudio);
            };
            document.body.addEventListener('click', activateAudio);
        } else {
            this.audioActivated = true;
            if (this.musicEnabled) {
                this.playLevelMusic();
            }
        }
    }

    setupAudio() {
        Object.values(this.sounds).flat().forEach(sound => {
            sound.preload = 'auto';
            sound.addEventListener('error', (e) => {
                console.error(`Error de audio en ${sound.src}:`, e);
                this.log(`🔇 Error en un archivo de sonido.`, 'warning');
            });
        });

        this.sounds.music.forEach(track => {
            track.loop = true; // La música siempre está en bucle
        });
    }

    async playLevelMusic() {
        if (!this.musicEnabled || !this.audioActivated) return;

        const availableTracks = this.sounds.music;
        if (availableTracks.length === 0) return;

        let newMusic;
        // Si hay más de una canción y ya hay una sonando, elige una diferente.
        if (availableTracks.length > 1 && this.currentMusic) {
            const playableTracks = availableTracks.filter(track => track !== this.currentMusic);
            newMusic = playableTracks[Math.floor(Math.random() * playableTracks.length)];
        } else {
            // Si no hay ninguna sonando o solo hay una canción, elige cualquiera al azar.
            newMusic = availableTracks[Math.floor(Math.random() * availableTracks.length)];
        }
        
        if (this.currentMusic === newMusic && !this.currentMusic.paused) {
            return;
        }
        
        await this.fadeToNewMusic(newMusic);
    }

    async fadeToNewMusic(newMusic) {
        return new Promise((resolve) => {
            if (this.musicFadeInterval) {
                clearInterval(this.musicFadeInterval);
            }
            
            const fadeDuration = 1200; // Duración del fundido en ms
            const steps = 30;
            const stepTime = fadeDuration / steps;
            const targetVolume = 0.3;

            // Si hay música sonando, hacer un fade-out
            if (this.currentMusic && !this.currentMusic.paused) {
                const initialVolume = this.currentMusic.volume;
                const stepVolumeOut = initialVolume / steps;

                const fadeOut = setInterval(() => {
                    this.currentMusic.volume = Math.max(0, this.currentMusic.volume - stepVolumeOut);
                    if (this.currentMusic.volume <= 0) {
                        clearInterval(fadeOut);
                        this.currentMusic.pause();
                        this.startNewMusicFadeIn(newMusic, targetVolume, steps, stepTime, resolve);
                    }
                }, stepTime);
            } else {
                this.startNewMusicFadeIn(newMusic, targetVolume, steps, stepTime, resolve);
            }
        });
    }

    startNewMusicFadeIn(newMusic, targetVolume, steps, stepTime, resolve) {
        newMusic.currentTime = 0;
        newMusic.volume = 0;
        
        const stepVolumeIn = targetVolume / steps;
        
        newMusic.play().catch(error => {
            console.error("Error al iniciar reproducción:", error);
            this.musicEnabled = false;
            this.musicButton.textContent = 'Activar Música';
            if (resolve) resolve();
        });
        
        this.currentMusic = newMusic;

        this.musicFadeInterval = setInterval(() => {
            this.currentMusic.volume = Math.min(targetVolume, this.currentMusic.volume + stepVolumeIn);
            if (this.currentMusic.volume >= targetVolume) {
                clearInterval(this.musicFadeInterval);
                this.musicFadeInterval = null;
                if (resolve) resolve();
            }
        }, stepTime);
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.playLevelMusic();
            this.musicButton.textContent = 'Pausar Música';
        } else {
            this.fadeOutMusic();
            this.musicButton.textContent = 'Activar Música';
        }
    }

    fadeOutMusic() {
        // ... (el código de esta función puede permanecer igual que en respuestas anteriores) ...
        if (!this.currentMusic || this.currentMusic.paused) return;
        const fadeDuration = 500;
        const steps = 10;
        const stepTime = fadeDuration / steps;
        const stepVolume = this.currentMusic.volume / steps;
        const fadeOut = setInterval(() => {
            this.currentMusic.volume = Math.max(0, this.currentMusic.volume - stepVolume);
            if (this.currentMusic.volume <= 0) {
                clearInterval(fadeOut);
                this.currentMusic.pause();
            }
        }, stepTime);
    }
    
    // ... El resto del código hasta la sección de gamepad es igual ...
    
    setupGamepad() {
        window.addEventListener("gamepadconnected", (e) => {
            this.log(`🎮 Gamepad conectado: ${e.gamepad.id}`);
            this.gamepadConnected = true;
            this.gamepadIndex = e.gamepad.index;
            this.gamepadControls.classList.remove('hidden');
            this.checkGamepad();
        });

        window.addEventListener("gamepaddisconnected", (e) => {
            this.log(`🎮 Gamepad desconectado: ${e.gamepad.id}`);
            this.gamepadConnected = false;
            this.gamepadIndex = null;
            this.gamepadControls.classList.add('hidden');
        });
    }

    checkGamepad() {
        if (!this.gamepadConnected) return;

        const gamepad = navigator.getGamepads()[this.gamepadIndex];
        if (!gamepad) return;

        // Si el juego ha terminado, solo escucha el botón de start para reiniciar
        if (this.gameOver) {
            if (gamepad.buttons[9]?.pressed) {
                this.resetGame();
            }
            requestAnimationFrame(() => this.checkGamepad());
            return;
        }

        const now = performance.now();
        const inputDelay = 120;

        if (gamepad.buttons[14].pressed && now - this.lastMove.left > inputDelay) {
            this.lastMove.left = now; this.handleGameInput('left');
        }
        if (gamepad.buttons[15].pressed && now - this.lastMove.right > inputDelay) {
            this.lastMove.right = now; this.handleGameInput('right');
        }
        if (gamepad.buttons[13].pressed && now - this.lastMove.down > inputDelay) {
            this.lastMove.down = now; this.handleGameInput('down');
        }
        if ((gamepad.buttons[1].pressed || gamepad.buttons[12].pressed) && now - this.lastMove.rotate > 180) {
            this.lastMove.rotate = now; this.handleGameInput('rotate');
        }
        if (gamepad.buttons[0].pressed && now - this.lastInputTime > 200) {
            this.lastInputTime = now; this.hardDrop();
        }
        
        requestAnimationFrame(() => this.checkGamepad());
    }

    // ... (El resto del código desde handleInput hasta el final es igual a las respuestas anteriores) ...
    
    playSound(type) {
        if (!this.audioActivated) return;
        
        try {
            const sound = this.sounds[type];
            if (!sound) return;
            
            if (sound instanceof Audio) {
                sound.currentTime = 0; 
                sound.play().catch(e => this.log(`🔇 Error al reproducir sonido: ${e.message}`, 'warning'));
            }
        } catch (e) {
            this.log(`🔇 Error con el sonido ${type}: ${e.message}`, 'warning');
        }
    }

    setupTouchControls() {
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'touch-controls';
            controlsDiv.innerHTML = `
                <div class="touch-buttons">
                    <button class="touch-left">←</button>
                    <button class="touch-right">→</button>
                    <button class="touch-rotate">↑</button>
                    <button class="touch-down">↓</button>
                    <button class="touch-drop">▼▼▼</button>
                </div>
            `;
            
            document.querySelector('.game-area').appendChild(controlsDiv);
            
            const addTouchControl = (selector, action) => {
                const btn = document.querySelector(selector);
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    action();
                    btn.classList.add('active');
                });
                btn.addEventListener('touchend', () => btn.classList.remove('active'));
                btn.addEventListener('touchcancel', () => btn.classList.remove('active'));
            };
            
            addTouchControl('.touch-left', () => this.handleGameInput('left'));
            addTouchControl('.touch-right', () => this.handleGameInput('right'));
            addTouchControl('.touch-down', () => this.handleGameInput('down'));
            addTouchControl('.touch-rotate', () => this.handleGameInput('rotate'));
            addTouchControl('.touch-drop', () => this.hardDrop());
        }
    }
    
    handleInput(e) {
        if (this.gameOver) {
            if (e.keyCode === 82) { // R
                this.resetGame();
            }
            return;
        }

        const now = performance.now();
        
        switch (e.keyCode) {
            case 37: // Left Arrow
                if (now - this.lastMove.left > this.inputDelay) {
                    this.lastMove.left = now;
                    this.handleGameInput('left');
                }
                break;
            case 39: // Right Arrow
                if (now - this.lastMove.right > this.inputDelay) {
                    this.lastMove.right = now;
                    this.handleGameInput('right');
                }
                break;
            case 40: // Down Arrow
                if (now - this.lastMove.down > this.inputDelay) {
                    this.lastMove.down = now;
                    this.handleGameInput('down');
                }
                break;
            case 38: // Up Arrow
                if (now - this.lastMove.rotate > 180) {
                    this.lastMove.rotate = now;
                    this.handleGameInput('rotate');
                }
                break;
            case 32: // Space
                if (now - this.lastInputTime > 200) {
                    this.lastInputTime = now;
                    this.hardDrop();
                }
                break;
        }
        
        if ([37, 38, 39, 40, 32].includes(e.keyCode)) {
            e.preventDefault();
        }
    }

    handleGameInput(direction) {
        if (this.gameOver) return;
        
        switch (direction) {
            case 'left': this.movePiece(-1, 0); break;
            case 'right': this.movePiece(1, 0); break;
            case 'down': this.movePiece(0, 1); break;
            case 'rotate': this.rotatePiece(); break;
        }
    }

    createBoard() {
        return Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    }

    createPiece() {
        const pieces = [
            [[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]],
            [[1, 1, 1], [0, 0, 1]], [[1, 1, 1], [1, 0, 0]], [[0, 1, 1], [1, 1, 0]],
            [[1, 1, 0], [0, 1, 1]]
        ];
        const colors = [1, 2, 3, 4, 5, 6, 7];
        
        return {
            matrix: pieces[Math.floor(Math.random() * pieces.length)],
            pos: { x: Math.floor(this.cols / 2) - 1, y: 0 },
            color: colors[Math.floor(Math.random() * colors.length)]
        };
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBoard();
        this.drawPiece(this.currentPiece);
        this.drawGhostPiece();
    }

    drawBoard() {
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 1;
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x]) {
                    this.ctx.fillStyle = this.getColor(this.board[y][x]);
                    this.ctx.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
                    this.ctx.strokeRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
                }
            }
        }
    }

    drawPiece(piece) {
        piece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    this.ctx.fillStyle = this.getColor(piece.color);
                    this.ctx.fillRect((piece.pos.x + x) * this.blockSize, (piece.pos.y + y) * this.blockSize, this.blockSize, this.blockSize);
                    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.strokeRect((piece.pos.x + x) * this.blockSize, (piece.pos.y + y) * this.blockSize, this.blockSize, this.blockSize);
                }
            });
        });
    }

    drawGhostPiece() {
        const ghost = { ...this.currentPiece, pos: {...this.currentPiece.pos} };
        while (!this.checkCollision(ghost, 0, 1)) {
            ghost.pos.y++;
        }
        this.ctx.save();
        this.ctx.globalAlpha = 0.2;
        this.drawPiece(ghost);
        this.ctx.restore();
    }

    getColor(value) {
        const colors = [null, '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22'];
        return colors[value] || '#ecf0f1';
    }

    gameLoop(timestamp = 0) {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const delta = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        this.lastFps = delta > 0 ? Math.round(1000 / delta) : 60;
        
        this.update(timestamp);
        this.draw();
        this.updateStatus();
        
        if (!this.gameOver) {
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    update(timestamp) {
        if (timestamp - this.lastDrop > this.dropSpeed) {
            this.movePiece(0, 1);
            this.lastDrop = timestamp;
        }
    }

    checkCollision(piece = this.currentPiece, offsetX = 0, offsetY = 0) {
        for (let y = 0; y < piece.matrix.length; y++) {
            for (let x = 0; x < piece.matrix[y].length; x++) {
                if (piece.matrix[y][x] !== 0) {
                    const newX = piece.pos.x + x + offsetX;
                    const newY = piece.pos.y + y + offsetY;
                    
                    if (newX < 0 || newX >= this.cols || newY >= this.rows || (newY >= 0 && this.board[newY][newX] !== 0)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    movePiece(dx, dy) {
        if (this.checkCollision(this.currentPiece, dx, dy)) {
            if (dy > 0) {
                this.placePiece();
                this.playSound('drop');
            }
            return false;
        }
        
        this.currentPiece.pos.x += dx;
        this.currentPiece.pos.y += dy;
        
        if (dx !== 0) this.playSound('move');
        if (dy > 0) this.lastDrop = performance.now();
        
        return true;
    }

    rotatePiece() {
        const originalMatrix = this.currentPiece.matrix;
        const rotated = originalMatrix[0].map((_, i) => originalMatrix.map(row => row[i]).reverse());
        this.currentPiece.matrix = rotated;
        
        if (this.checkCollision()) {
            const kickX = this.currentPiece.pos.x > this.cols / 2 ? -1 : 1;
            if (!this.checkCollision(this.currentPiece, kickX, 0)) {
                this.currentPiece.pos.x += kickX;
            } else if (!this.checkCollision(this.currentPiece, kickX * -1, 0)) {
                this.currentPiece.pos.x -= kickX;
            }
            else {
                this.currentPiece.matrix = originalMatrix;
                return false;
            }
        }
        
        this.playSound('rotate');
        return true;
    }

    hardDrop() {
        let dropDistance = 0;
        while (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.pos.y++;
            dropDistance++;
        }
        this.score += dropDistance;
        this.placePiece();
        this.playSound('drop');
    }

    placePiece() {
        this.currentPiece.matrix.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const boardY = this.currentPiece.pos.y + y;
                    const boardX = this.currentPiece.pos.x + x;
                    if (boardY >= 0 && boardY < this.rows) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            });
        });
        
        this.checkLines();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();
        
        if (this.checkCollision()) {
            this.showGameOver();
        }
    }

    checkLines() {
        let linesCleared = 0;
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                for (let x = 0; x < this.cols; x++) {
                    this.createExplosion(x, y);
                }
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                y++;
                this.playSound('lineclear');
            }
        }
        
        if (linesCleared > 0) {
            const points = [0, 100, 300, 500, 800][linesCleared] * this.level;
            this.score += points;
            this.line += linesCleared;
            
            if (Math.floor(this.line / 10) >= this.level) {
                this.level++;
                this.dropSpeed = Math.max(100, this.dropSpeed - 100);
                this.playSound('levelup');
                this.playLevelMusic(); // Cambiar de canción al subir de nivel
                this.showLevelUp();
            }
        }
    }

    createExplosion(x, y) {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        const rect = this.canvas.getBoundingClientRect();
        explosion.style.left = `${rect.left + window.scrollX + x * this.blockSize + this.blockSize / 2}px`;
        explosion.style.top = `${rect.top + window.scrollY + y * this.blockSize + this.blockSize / 2}px`;
        document.body.appendChild(explosion);
        setTimeout(() => explosion.remove(), 500);
    }

    showLevelUp() {
        const levelUpDiv = document.createElement('div');
        levelUpDiv.className = 'level-up';
        levelUpDiv.innerHTML = `<div class="level-up-content"><h2>¡Nivel ${this.level}!</h2><p>Velocidad aumentada</p></div>`;
        document.body.appendChild(levelUpDiv);
        setTimeout(() => levelUpDiv.classList.add('show'), 10);
        setTimeout(() => {
            levelUpDiv.classList.remove('show');
            setTimeout(() => levelUpDiv.remove(), 300);
        }, 1500);
    }

    updateStatus() {
        this.systemStatus.innerHTML = `Estado: ${this.gameOver ? '🛑 Game Over' : '▶ Jugando'} | FPS: ${this.lastFps || '--'}`;
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.lineElement.textContent = this.line;
    }

    updateDbStatus(connected) {
        if (connected) {
            this.dbStatus.textContent = 'DB: Conectada';
            this.dbStatus.className = "connected";
        } else {
            this.dbStatus.textContent = 'DB: Modo sin conexión';
            this.dbStatus.className = "warning";
        }
    }

    displayScores(scores) {
        if (!scores || scores.length === 0) {
            this.scoresList.innerHTML = '<p>No hay puntajes.</p>';
            return;
        }
        
        let html = '<ol>';
        scores.forEach(score => {
            html += `<li><span class="name">${score.name || 'Anónimo'}</span><span class="score">${score.score}</span><span class="date">${score.date || ''}</span></li>`;
        });
        html += '</ol>';
        this.scoresList.innerHTML = html;
    }

    async showGameOver() {
        this.gameOver = true;
        this.playSound('gameover');
        this.musicWasPlaying = this.musicEnabled && this.currentMusic && !this.currentMusic.paused;
        this.fadeOutMusic();
        
        const gameOverDiv = document.createElement('div');
        gameOverDiv.className = 'game-over-overlay';
        gameOverDiv.innerHTML = `
            <div class="game-over-content">
                <h3>¡Game Over!</h3>
                <p>Puntaje final: ${this.score}</p>
                <div class="save-form">
                    <input type="text" id="playerNameInput" placeholder="Tu nombre" maxlength="50" required>
                    <button id="saveScoreButton">Guardar</button>
                </div>
                <button id="restartButton">Volver a Jugar</button>
            </div>
        `;
        document.body.appendChild(gameOverDiv);
        setTimeout(() => gameOverDiv.classList.add('show'), 100);
        
        document.getElementById('saveScoreButton').addEventListener('click', async (e) => {
            const button = e.target;
            const nameInput = document.getElementById('playerNameInput');
            const name = nameInput.value.trim();
            if (!name) return;
            
            button.disabled = true;
            button.textContent = 'Guardando...';
            const saved = await this.database.saveScore(name, this.score, this.level, this.line);
            if (saved) {
                this.displayScores(await this.database.getTopScores());
                button.textContent = '✓ Guardado';
            } else {
                button.textContent = 'Error';
                button.disabled = false;
            }
        });
        
        document.getElementById('restartButton').addEventListener('click', () => {
             gameOverDiv.remove();
             this.resetGame();
        });
    }

    resetGame() {
        this.board = this.createBoard();
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        this.score = 0;
        this.level = 1;
        this.line = 0;
        this.gameOver = false;
        this.dropSpeed = 1000;
        
        if (this.musicWasPlaying) {
            this.musicEnabled = true;
            this.musicButton.textContent = 'Pausar Música';
            this.playLevelMusic();
        }
        
        this.updateStatus();
        this.lastTimestamp = 0;
        this.gameLoop();
    }

    log(message, type = 'info') {
        const line = document.createElement('div');
        line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        if (type === 'error') line.className = 'error';
        if (type === 'warning') line.className = 'warning';
        this.consoleOutput.appendChild(line);
        this.consoleOutput.scrollTop = this.consoleOutput.scrollHeight;
    }

    showFatalError() {
        this.systemStatus.textContent = 'Estado: 🛑 Error';
        this.dbStatus.className = 'error';
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fatal-error';
        errorDiv.innerHTML = `<h3>Error Fatal</h3><p>No se pudo iniciar el juego. Revisa la consola para más detalles.</p><button onclick="window.location.reload()">Reintentar</button>`;
        document.querySelector('.game-area').appendChild(errorDiv);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.tetrisGame = new TetrisGame();
    }, 100);
});