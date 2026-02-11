const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Chess } = require('chess.js');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Inicializar SQLite
const db = new sqlite3.Database('./chess.db', (err) => {
    if (err) console.error("Error al conectar con SQLite:", err.message);
    else console.log('Conectado a la base de datos SQLite.');
});

// Crear tablas si no existen
db.run(`CREATE TABLE IF NOT EXISTS moves (
    game_id TEXT,
    san TEXT,
    fen TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.run(`CREATE TABLE IF NOT EXISTS games (
    game_id TEXT PRIMARY KEY,
    white_time REAL NOT NULL DEFAULT 600,
    black_time REAL NOT NULL DEFAULT 600,
    turn_active TEXT NOT NULL DEFAULT 'white',
    game_started INTEGER NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Almacén de juegos en memoria
const games = new Map();

// Configuración de tiempos (10 minutos por defecto)
const INITIAL_TIME = 600;

// Guardar estado de la partida en SQLite
function saveGameState(gameId, game) {
    db.run(`INSERT OR REPLACE INTO games (game_id, white_time, black_time, turn_active, game_started, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [gameId, game.timers.white, game.timers.black, game.turnActive, game.timerActive ? 1 : 0]);
}

function getOrCreateGame(gameId, callback) {
    if (games.has(gameId)) {
        callback(games.get(gameId));
        return;
    }

    // Cargar movimientos y estado guardado en paralelo
    db.all(`SELECT san FROM moves WHERE game_id = ? ORDER BY created_at ASC`, [gameId], (err, rows) => {
        if (err) { console.error(err); return; }

        db.get(`SELECT * FROM games WHERE game_id = ?`, [gameId], (err2, savedState) => {
            if (err2) console.error(err2);

            const game = {
                chess: new Chess(),
                players: {
                    white: null,
                    black: null
                },
                timers: {
                    white: savedState ? savedState.white_time : INITIAL_TIME,
                    black: savedState ? savedState.black_time : INITIAL_TIME
                },
                turnActive: savedState ? savedState.turn_active : 'white',
                timerActive: false, // Siempre arranca pausado al reconectar
                lastMoveTime: null,
            };

            if (rows && rows.length > 0) {
                rows.forEach(row => {
                    try { game.chess.move(row.san); } catch (e) { }
                });
                // Si no hay estado guardado, deducir turno del estado del tablero
                if (!savedState) {
                    game.turnActive = game.chess.turn() === 'w' ? 'white' : 'black';
                }
            }

            games.set(gameId, game);
            callback(game);
        });
    });
}

function updateTimers(game) {
    if (!game.timerActive || !game.lastMoveTime) return;

    const now = Date.now();
    const delta = (now - game.lastMoveTime) / 1000;

    // El turno activo es quien tiene que mover Y pulsar el reloj
    // Pero en este requerimiento especial: "Despues de que un jugador mueva la ficha debe apretar el boton para dar inicio al turno del siguiente"
    // Esto implica que si White mueve, su reloj SIGUE corriendo hasta que pulsa el botón.
    // Entonces 'turnActive' define a quién se le descuenta tiempo.

    game.timers[game.turnActive] = Math.max(0, game.timers[game.turnActive] - delta);
    game.lastMoveTime = now;

    if (game.timers[game.turnActive] <= 0) {
        game.timerActive = false;
        // Broadcast time out?
    }
}

io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    // Bucle del servidor para actualizar timers cada segundo (opcional, o confiar en timestamps)
    // Para simplificar, calculamos al recibir eventos y enviamos 'timeUpdate'

    socket.on('joinGame', ({ gameId, user }) => {
        if (!gameId) return;
        socket.join(gameId);

        getOrCreateGame(gameId, (game) => {
            // Asignar color si hay hueco
            let color = null;
            if (!game.players.white) {
                game.players.white = { ...user, socketId: socket.id };
                color = 'white';
            } else if (!game.players.black) {
                game.players.black = { ...user, socketId: socket.id };
                color = 'black';
            } else {
                // Espectador o reconexión (si coincide ID, etc. - simple por ahora)
            }

            // Si hay movimientos previos, la partida fue guardada y se puede reanudar
            const hasHistory = game.chess.history().length > 0;

            socket.emit('initGame', {
                fen: game.chess.fen(),
                history: game.chess.history(),
                players: game.players,
                timers: game.timers,
                turnActive: game.turnActive,
                color: color,
                gameStarted: hasHistory
            });

            io.to(gameId).emit('playersUpdate', game.players);
        });
    });

    socket.on('startGame', (gameId) => {
        const game = games.get(gameId);
        if (!game) return;

        game.timerActive = true;
        game.lastMoveTime = Date.now();
        saveGameState(gameId, game);
        io.to(gameId).emit('gameStarted', true);
    });

    socket.on('move', ({ gameId, move }) => {
        const game = games.get(gameId);
        if (!game) return;

        try {
            const result = game.chess.move(move);
            if (result) {
                // Guardar movimiento en DB
                const stmt = db.prepare("INSERT INTO moves (game_id, san, fen) VALUES (?, ?, ?)");
                stmt.run(gameId, result.san, game.chess.fen());
                stmt.finalize();

                // Lógica de Sonidos
                let sound = 'move';
                if (game.chess.isCheckmate()) sound = 'win';
                else if (game.chess.isCheck()) sound = 'check';
                else if (result.captured) sound = 'capture';
                else if (result.flags.includes('k') || result.flags.includes('q')) sound = 'castle';

                // Cambio automático de turno al mover
                if (game.timerActive) {
                    updateTimers(game);
                    game.turnActive = game.turnActive === 'white' ? 'black' : 'white';
                    game.lastMoveTime = Date.now();
                }

                // Persistir estado de la partida
                saveGameState(gameId, game);

                io.to(gameId).emit('gameState', {
                    fen: game.chess.fen(),
                    history: game.chess.history(),
                    sound: sound,
                    lastMove: result
                });

                // Enviar actualización de timers con el turno ya cambiado
                io.to(gameId).emit('timerUpdate', {
                    timers: game.timers,
                    turnActive: game.turnActive
                });

            } else {
                socket.emit('invalidMove', move);
            }
        } catch (e) {
            console.error(e);
        }
    });

    socket.on('disconnect', () => {
        // Manejar desconexión
    });
});

// Intervalo global para sincronizar relojes cada segundo (opcional para visualización fluida)
setInterval(() => {
    games.forEach((game, gameId) => {
        if (game.timerActive) {
            updateTimers(game);
            // Solo emitir si cambió significativamente o cada X segundos para ahorrar ancho de banda
            // Aquí emitimos siempre para testing
            /* io.to(gameId).emit('timerTick', game.timers); */
        }
    });
}, 1000);

function getGameOverReason(chess) {
    if (chess.isCheckmate()) return 'checkmate';
    if (chess.isDraw()) return 'draw';
    if (chess.isStalemate()) return 'stalemate';
    if (chess.isThreefoldRepetition()) return 'threefold';
    if (chess.isInsufficientMaterial()) return 'insufficient';
    return 'unknown';
}

function getWinner(chess) {
    if (chess.isCheckmate()) {
        return chess.turn() === 'w' ? 'Black' : 'White';
    }
    return 'Draw';
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});
