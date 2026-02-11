import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import io from 'socket.io-client';

// Conexión al socket (ajusta la URL si es necesario)
const socket = io('http://localhost:3000');

export default function ChessGame() {
    const [game, setGame] = useState(new Chess());
    const [fen, setFen] = useState(game.fen());
    const [playerCount, setPlayerCount] = useState(0);
    const [gameId, setGameId] = useState('');

    const engineRef = useRef(null);

    useEffect(() => {
        // Obtener gameId de la URL
        const params = new URLSearchParams(window.location.search);
        const id = params.get('gameId') || 'default-room';
        setGameId(id);

        // Unirse a la sala
        socket.emit('joinGame', id);

        // Listeners
        socket.on('playerJoined', ({ count }) => {
            setPlayerCount(count);
        });

        socket.on('gameState', (serverFen) => {
            const newGame = new Chess(serverFen);
            setGame(newGame);
            setFen(serverFen);
        });

        socket.on('invalidMove', (move) => {
            console.log('Movimiento inválido rechazado por el servidor:', move);
            // Revertir estado local si fuera necesario, pero gameState debería encargarse
            // Forzar actualización visual si hubo desincronización
            setFen(game.fen());
        });

        socket.on('gameOver', ({ reason, winner }) => {
            alert(`Juego terminado: ${reason}. Ganador: ${winner}`);
        });

        return () => {
            socket.off('playerJoined');
            socket.off('gameState');
            socket.off('invalidMove');
            socket.off('gameOver');
        };
    }, []);

    function onDrop(sourceSquare, targetSquare) {
        // Intentar movimiento localmente para feedback inmediato (opcional, pero mejor esperar validación server para evitar estados ilegales complejos)
        // Sin embargo, react-chessboard necesita que el movimiento parezca exitoso para soltar la pieza.
        // Una estrategia común es permitirlo visualmente y revertir si el servidor no confirma, 
        // pero aquí enviaremos el movimiento y esperaremos el nuevo FEN.

        // Verificamos si es legal localmente primero para UX rápida
        try {
            const tempGame = new Chess(game.fen());
            const move = tempGame.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q', // siempre promover a reina por simplicidad UI
            });

            if (!move) return false; // movimiento ilegal local

            // Emitir al servidor
            socket.emit('move', {
                gameId,
                move: { from: sourceSquare, to: targetSquare, promotion: 'q' }
            });

            // Optimist update: mostramos el movimiento
            // El servidor nos corregirá si fallamos
            setGame(tempGame);
            setFen(tempGame.fen());
            return true;

        } catch (e) {
            return false;
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white p-4">
            <div className="max-w-3xl w-full flex flex-col gap-6">

                {/* Header */}
                <div className="flex justify-between items-center bg-neutral-800 p-4 rounded-xl shadow-lg border border-neutral-700">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Chess Duel
                    </h1>
                    <div className="flex gap-4 text-sm font-medium text-neutral-400">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Room: <span className="text-white">{gameId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="i-lucide-users w-4 h-4"></span>
                            Players: <span className="text-white">{playerCount}</span>
                        </div>
                    </div>
                </div>

                {/* Board Container */}
                <div className="relative aspect-square w-full max-w-[600px] mx-auto shadow-2xl rounded-lg overflow-hidden border-4 border-neutral-700">
                    <Chessboard
                        position={fen}
                        onPieceDrop={onDrop}
                        customDarkSquareStyle={{ backgroundColor: '#779556' }}
                        customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                        animationDuration={200}
                    />
                </div>

                {/* Instructions / Footer */}
                <div className="text-center text-neutral-500 text-sm">
                    <p>Comparte la URL para invitar a un amigo.</p>
                    <p className="mt-2 text-xs opacity-50">Powered by Node.js & React</p>
                </div>

            </div>
        </div>
    );
}
