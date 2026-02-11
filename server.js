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

// Crear tabla de movimientos si no existe
db.run(`CREATE TABLE IF NOT EXISTS moves (
    game_id TEXT,
    san TEXT,
    fen TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Almacén de juegos en memoria (caché activo para velocidad)
// En producción real, validar si queremos reconstruir siempre de DB o mantener en memoria.
// Aquí: memoria + persistencia asíncrona.
const games = new Map();

// Cargar juego desde DB o crear nuevo en memoria
function getOrCreateGame(gameId, callback) {
    if (games.has(gameId)) {
        callback(games.get(gameId));
        return;
    }

    // Intentar reconstruir desde DB
    db.all(`SELECT san FROM moves WHERE game_id = ? ORDER BY created_at ASC`, [gameId], (err, rows) => {
        if (err) {
            console.error(err);
            // Fallback a juego nuevo si falla DB
            const game = { chess: new Chess(), players: [] };
            games.set(gameId, game);
            callback(game);
            return;
        }

        const game = {
            chess: new Chess(),
            players: []
        };

        if (rows && rows.length > 0) {
            rows.forEach(row => {
                try {
                    game.chess.move(row.san);
                } catch (e) {
                    console.error("Error replay move:", row.san, e);
                }
            });
        }

        games.set(gameId, game);
        callback(game);
    });
}

io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);

    socket.on('joinGame', (gameId) => {
        if (!gameId) return;

        socket.join(gameId);

        getOrCreateGame(gameId, (game) => {
            // Enviar estado actual (FEN)
            socket.emit('gameState', game.chess.fen());

            // Enviar historial de movimientos (History array)
            // chess.history() devuelve array de SAN ['e4', 'e5', ...]
            socket.emit('moveHistory', game.chess.history());

            // Notificar a la sala
            io.to(gameId).emit('playerJoined', { count: io.sockets.adapter.rooms.get(gameId)?.size });
        });
    });

    socket.on('move', ({ gameId, move }) => {
        const game = games.get(gameId);
        // Si el servidor se reinició y el cliente manda move sin haber hecho join (raro, pero posible si reconnect),
        // idealmente deberíamos cargar el juego. Pero asumimos flujo normal join -> move.
        if (!game) return;

        try {
            // Intentar el movimiento
            const result = game.chess.move(move);

            if (result) {
                // Guardar en DB
                const stmt = db.prepare("INSERT INTO moves (game_id, san, fen) VALUES (?, ?, ?)");
                stmt.run(gameId, result.san, game.chess.fen());
                stmt.finalize();

                // Actualizar a todos
                io.to(gameId).emit('gameState', game.chess.fen());
                io.to(gameId).emit('moveHistory', game.chess.history());

                if (game.chess.isGameOver()) {
                    io.to(gameId).emit('gameOver', {
                        reason: getGameOverReason(game.chess),
                        winner: getWinner(game.chess)
                    });
                }
            } else {
                socket.emit('invalidMove', move);
            }
        } catch (e) {
            console.error("Movimiento inválido:", e);
            socket.emit('invalidMove', move);
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
    });
});

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
