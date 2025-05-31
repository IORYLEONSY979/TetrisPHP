Tetris POO - Un Juego Clásico con Arquitectura Web Moderna

Este proyecto es una implementación completa del clásico juego Tetris, desarrollado desde cero utilizando tecnologías web modernas y siguiendo los principios de la Programación Orientada a Objetos (POO) tanto en el frontend (JavaScript) como en el backend (PHP).

El objetivo principal es demostrar la creación de una aplicación web interactiva con una clara separación de responsabilidades: la lógica del juego reside en el cliente, mientras que la persistencia de datos (tabla de puntuaciones) es manejada por un servidor seguro.

✨ Características Principales
Jugabilidad Clásica: Toda la mecánica que conoces y amas de Tetris.
Sistema de Puntuación y Niveles: Aumenta la velocidad y la puntuación a medida que limpias más líneas.
Música y Sonidos: Música de fondo aleatoria y efectos de sonido para una experiencia inmersiva.
Soporte Multi-control: Juega con Teclado o con un Gamepad conectado.
Tabla de Líderes Persistente: Las 10 mejores puntuaciones se guardan en una base de datos MySQL y se muestran en tiempo real.
Diseño Responsivo: Se adapta para jugar tanto en escritorio como en dispositivos móviles (con controles táctiles).
Arquitectura Orientada a Objetos: El código está organizado en clases (TetrisGame, DatabaseManager, Database) para un mantenimiento más sencillo, seguro y escalable.
💻 Pila Tecnológica
Frontend (Cliente)
HTML5: Estructura semántica del juego.
CSS3: Estilos, animaciones y diseño responsivo con variables CSS.
JavaScript (ES6+): Toda la lógica del juego, renderizado en <canvas>, manejo de eventos y comunicación con la API, todo encapsulado en la clase TetrisGame.
Backend (Servidor)
PHP 8+: Lenguaje del lado del servidor para la API.
PHP Orientado a Objetos: La clase Database maneja toda la interacción con la base de datos de forma segura y abstraída.
MySQL: Base de datos relacional para almacenar las puntuaciones de forma persistente.
API RESTful: Endpoints para obtener y guardar puntuaciones, comunicándose a través de JSON.
🚀 Instalación y Puesta en Marcha Local
Para ejecutar este proyecto en tu propia máquina, sigue estos pasos:

1. Prerrequisitos
Asegúrate de tener un entorno de servidor local instalado, como XAMPP, WAMP o MAMP. Este debe incluir:

Un servidor web Apache
PHP
Un servidor de base de datos MySQL (con phpMyAdmin, por ejemplo)
2. Clonar el Repositorio
Abre una terminal y clona este repositorio en la carpeta htdocs (para XAMPP) o www (para WAMP/MAMP) de tu servidor local.

Bash

git clone https://github.com/IORYLEONSY979/TetrisPHP.git
cd tu-repositorio
3. Configurar la Base de Datos
Inicia los servicios de Apache y MySQL en tu panel de control de XAMPP/WAMP.
Abre tu navegador y ve a http://localhost/phpmyadmin.
Crea una nueva base de datos llamada tetris_db.
Selecciona la base de datos tetris_db y ve a la pestaña "SQL".
Copia y ejecuta el siguiente código para crear la tabla de puntuaciones:
<!-- end list -->

SQL

CREATE TABLE `scores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `score` int(11) NOT NULL,
  `level` int(11) NOT NULL,
  `line` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
4. Ejecutar el Juego
¡Listo! Abre tu navegador y navega a la URL de tu proyecto. Por ejemplo:
http://localhost/nombre-de-la-carpeta-del-proyecto/

🎮 Cómo Jugar
Acción	Teclado	Gamepad	Táctil
Mover a la Izquierda	Flecha Izquierda	D-Pad Izquierdo	Botón Izquierdo
Mover a la Derecha	Flecha Derecha	D-Pad Derecho	Botón Derecho
Bajar Rápido (Soft Drop)	Flecha Abajo	D-Pad Abajo	Botón Abajo
Rotar Pieza	Flecha Arriba	Botón B / O / D-Pad Arriba	Botón Rotar
Caída Instantánea	Barra Espaciadora	Botón A / X	Botón Caída
Reiniciar (Game Over)	Tecla R	Botón Start	Botón Reiniciar

Exportar a Hojas de cálculo
🏗️ Arquitectura del Código
El proyecto está estructurado para separar las responsabilidades:

index.html: Punto de entrada principal y esqueleto de la aplicación.
styles/game.css: Contiene todos los estilos visuales.
scripts/game.js: El corazón del frontend. La clase TetrisGame gestiona el estado del juego, el bucle principal, el renderizado y los controles.
scripts/DatabaseManager.js: Clase de JavaScript encargada de comunicarse con la API del backend mediante fetch().
api/: Carpeta que contiene los scripts del lado del servidor.
Database.php: Clase PHP orientada a objetos que encapsula toda la lógica de la base de datos (conexión, inserción, selección) usando Prepared Statements para máxima seguridad.
save_score.php / get_scores.php: Endpoints de la API que utilizan el objeto Database para realizar las acciones.
🎶 Créditos y Agradecimientos
Este proyecto utiliza recursos de audio de talentosos creadores. ¡Por favor, apóyalos!

Música de Fondo
Nota: Las pistas de música se seleccionan aleatoriamente de la siguiente lista.

"Korobeiniki (Tetris)" por 8-Bit Soul: Enlace a SoundCloud
"Tetris A" por guskrirbs: Enlace a Itch.io
"Miyuki - Tetris (Techno Mix)" por Miyuki: Enlace a SoundCloud
"Techno Tetris Remix" por TheGam3r3: Enlace a SoundCloud
Efectos de Sonido
Los efectos de sonido como "Level Up", limpieza de línea y movimiento de piezas fueron obtenidos de Pixabay Sound Effects, una excelente fuente de sonidos libres de derechos. Enlace a Pixabay
📜 Licencia
Este proyecto está distribuido bajo la Licencia MIT. Consulta el archivo LICENSE para más detalles.

MIT License

Copyright (c) 2025 [Tu Nombre o Usuario de GitHub]

Permission is hereby granted...
