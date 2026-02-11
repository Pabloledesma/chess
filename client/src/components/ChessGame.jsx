import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import io from 'socket.io-client';
import MoveHistory from './MoveHistory';

// Conexión al socket
const socket = io('http://localhost:3000');

export default function ChessGame() {
    const [game, setGame] = useState(new Chess());
    const [fen, setFen] = useState(game.fen());
    const [history, setHistory] = useState([]);
    const [playerCount, setPlayerCount] = useState(0);
    const [gameId, setGameId] = useState('');

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
            // Al recibir estado, actualizamos el juego local sin perder referencia
            // Pero necesitamos reconstruirlo para validaciones correctas si usamos la instancia
            const newGame = new Chess(serverFen);
            setGame(newGame);
            setFen(serverFen);
        });

        socket.on('moveHistory', (serverHistory) => {
            setHistory(serverHistory);
        });

        socket.on('invalidMove', (move) => {
            console.log('Movimiento inválido rechazado por el servidor:', move);
            setFen(game.fen());
        });

        socket.on('gameOver', ({ reason, winner }) => {
            alert(`Juego terminado: ${reason}. Ganador: ${winner}`);
        });

        return () => {
            socket.off('playerJoined');
            socket.off('gameState');
            socket.off('moveHistory');
            socket.off('invalidMove');
            socket.off('gameOver');
        };
    }, []);

    function onDrop(sourceSquare, targetSquare) {
        try {
            const tempGame = new Chess(game.fen());
            const move = tempGame.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q',
            });

            if (!move) return false;

            // Emitir al servidor
            socket.emit('move', {
                gameId,
                move: { from: sourceSquare, to: targetSquare, promotion: 'q' }
            });

            // Optimist update UI
            setGame(tempGame);
            setFen(tempGame.fen());
            // History se actualizará cuando el serve confirme
            return true;

        } catch (e) {
            return false;
        }
    }

    return (
        <div className="flex flex-col h-screen bg-neutral-950 text-white overflow-hidden">

            {/* Navbar simplificado */}
            <div className="h-12 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0">
                <h1 className="font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Chess Duel
                </h1>
                <div className="flex gap-4 text-xs font-mono text-neutral-400">
                    <span>Room: {gameId}</span>
                    <span>Players: {playerCount}</span>
                </div>
            </div>

            {/* Main Content: Flex Row */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Panel: History (25% width, min 250px) */}
                <div className="w-1/4 min-w-[250px] max-w-sm p-4 bg-neutral-900 border-r border-neutral-800 shrink-0">
                    <MoveHistory history={history} />
                </div>

                {/* Right Panel: Board Container */}
                <div className="flex-1 bg-neutral-950 flex items-center justify-center p-4">
                    {/* 
                El contenedor del tablero debe adaptarse a la altura disponible para no hacer scroll.
                Calculamos la altura usando vh o dejándolo crecer pero con max-height.
                Para que react-chessboard sea responsive pero mantenga aspect-ratio, lo envolvemos.
             */}
                    <div className="h-full w-full max-h-[calc(100vh-5rem)] max-w-[calc(100vh-5rem)] aspect-square shadow-2xl rounded-sm overflow-hidden border-8 border-neutral-800">
                        <Chessboard
                            position={fen}
                            onPieceDrop={onDrop}
                            customDarkSquareStyle={{ backgroundColor: '#779556' }}
                            customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                            animationDuration={200}
                        />
                    </div>
                </div>

            </div>
        </div>
    );
}
