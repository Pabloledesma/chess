
import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import io from 'socket.io-client';
import MoveHistory from './MoveHistory';
import LoginModal from './LoginModal';
import GameInfo from './GameInfo';

// Conexión al socket
const socket = io('http://localhost:3000');

// Sonidos
const sounds = {
    move: new Audio('/sounds/move.wav'),
    capture: new Audio('/sounds/capture.wav'),
    check: new Audio('/sounds/check.wav'),
    castle: new Audio('/sounds/castle.wav'),
    win: new Audio('/sounds/win.wav'),
};


export default function ChessGame() {
    const [game, setGame] = useState(new Chess());
    const [fen, setFen] = useState(game.fen());
    const [history, setHistory] = useState([]);
    const [gameId, setGameId] = useState('');

    // Ref para acceder al FEN actual dentro de closures de socket
    const fenRef = useRef(game.fen());

    // Estado Multijugador Fase 3
    const [user, setUser] = useState(null); // { name, avatar }
    const [players, setPlayers] = useState({ white: null, black: null });
    const [timers, setTimers] = useState({ white: 600, black: 600 });
    const [turnActive, setTurnActive] = useState('white'); // De quién es el turno de RELOJ
    const [myColor, setMyColor] = useState(null); // 'white' | 'black' | 'spectator'
    const [gameStarted, setGameStarted] = useState(false);
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('gameId') || 'default-room';
        setGameId(id);

        // Listeners socket
        socket.on('initGame', (data) => {
            const newGame = new Chess(data.fen);
            setGame(newGame);
            setFen(data.fen);
            fenRef.current = data.fen;
            setHistory(data.history);
            setPlayers(data.players);
            setTimers(data.timers);
            setTurnActive(data.turnActive);
            setMyColor(data.color);
            setGameStarted(data.gameStarted || false);
        });

        socket.on('playersUpdate', (newPlayers) => {
            setPlayers(newPlayers);
        });

        socket.on('gameStarted', (started) => {
            setGameStarted(started);
        });

        socket.on('gameState', (data) => {
            const newGame = new Chess(data.fen);
            setGame(newGame);
            setFen(data.fen);
            fenRef.current = data.fen;
            setHistory(data.history);

            // Reproducir sonido
            if (data.sound && sounds[data.sound]) {
                sounds[data.sound].currentTime = 0;
                sounds[data.sound].play().catch(e => console.log("Audio play failed", e));
            }
        });

        socket.on('timerUpdate', (data) => {
            setTimers(data.timers);
            setTurnActive(data.turnActive);
        });

        socket.on('invalidMove', (move) => {
            console.warn('[SERVIDOR] Movimiento rechazado:', move);
            // Usar ref para obtener el FEN actual (no la closure obsoleta)
            setFen(fenRef.current);
        });

        return () => {
            socket.off('initGame');
            socket.off('playersUpdate');
            socket.off('gameStarted');
            socket.off('gameState');
            socket.off('timerUpdate');
            socket.off('invalidMove');
        };
    }, []);

    // Efecto para reconexión (importante en desarrollo con reinicios de servidor)
    useEffect(() => {
        function handleConnect() {
            if (user && gameId) {
                console.log("Reconectando a la sala...");
                socket.emit('joinGame', { gameId, user });
            }
        }
        socket.on('connect', handleConnect);
        return () => socket.off('connect', handleConnect);
    }, [user, gameId]);

    const handleLogin = (userData) => {
        setUser(userData);
        socket.emit('joinGame', { gameId, user: userData });
    };

    const handleStartGame = () => {
        socket.emit('startGame', gameId);
    };

    // react-chessboard v5: callbacks reciben un objeto, no parámetros separados
    function onDrag({ piece, square }) {
        console.log(`[DRAG] Pieza: ${piece.pieceType}, Origen: ${square}, Turno chess.js: ${game.turn()}, Mi color: ${myColor}, Partida iniciada: ${gameStarted}`);
    }

    function onDrop({ sourceSquare, targetSquare }) {
        console.log(`[DROP] Origen: ${sourceSquare} → Destino: ${targetSquare}`);

        if (!targetSquare) {
            console.warn('[DROP RECHAZADO] Soltada fuera del tablero');
            return false;
        }

        if (!gameStarted) {
            console.warn('[DROP RECHAZADO] La partida no ha iniciado');
            return false;
        }

        if (game.turn() === 'w' && myColor !== 'white') {
            console.warn('[DROP RECHAZADO] No es mi turno (turno de blancas, soy', myColor + ')');
            return false;
        }
        if (game.turn() === 'b' && myColor !== 'black') {
            console.warn('[DROP RECHAZADO] No es mi turno (turno de negras, soy', myColor + ')');
            return false;
        }

        try {
            const tempGame = new Chess(game.fen());
            const move = tempGame.move({
                from: sourceSquare,
                to: targetSquare,
                promotion: 'q',
            });

            if (!move) {
                console.warn(`[MOVIMIENTO ILEGAL] ${sourceSquare} → ${targetSquare} no es válido según chess.js`);
                return false;
            }

            console.log(`[MOVIMIENTO VÁLIDO] ${move.san} (${sourceSquare} → ${targetSquare})`, move);

            // Actualizar estado local inmediatamente (optimista)
            const newFen = tempGame.fen();
            setGame(tempGame);
            setFen(newFen);
            fenRef.current = newFen;

            // Enviar al servidor
            socket.emit('move', {
                gameId,
                move: { from: sourceSquare, to: targetSquare, promotion: 'q' }
            });

            return true;
        } catch (e) {
            console.error(`[ERROR] Excepción en chess.js al intentar ${sourceSquare} → ${targetSquare}:`, e);
            return false;
        }
    }

    if (!user) {
        return <LoginModal onSubmit={handleLogin} />;
    }

    return (
        <div className="flex flex-col h-screen bg-neutral-950 text-white overflow-hidden font-sans">

            {/* Navbar Minimalista */}
            <div className="h-14 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0 z-10 shadow-md">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
                    <span className="text-2xl">♟️</span> Chess Duel
                </h1>
                <div className="flex gap-6 text-sm font-medium text-neutral-400">
                    <div className="flex items-center gap-2 bg-neutral-800 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Room: <span className="text-white">{gameId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span>Soy: </span>
                        <span className={`px - 2 py - 0.5 rounded text - xs uppercase font - bold ${myColor === 'white' ? 'bg-white text-black' : myColor === 'black' ? 'bg-black text-white border border-neutral-600' : 'bg-gray-600 text-white'} `}>
                            {myColor || 'Espectador'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">

                {/* Left Sidebar: Game Info + History */}
                <div className="w-[320px] bg-neutral-900 border-r border-neutral-800 flex flex-col shrink-0 z-0">

                    {/* Top: Game Info & Controls */}
                    <div className="p-4 border-b border-neutral-800 bg-neutral-800/50">
                        <GameInfo
                            players={players}
                            timers={timers}
                            turnActive={turnActive}
                            myColor={myColor}
                            gameStarted={gameStarted}
                            onStartGame={handleStartGame}
                        />
                    </div>

                    {/* Bottom: History (Fills remaining space) */}
                    <div className="flex-1 overflow-hidden min-h-0">
                        <MoveHistory history={history} />
                    </div>
                </div>

                {/* Right Area: Board */}
                <div className="flex-1 bg-neutral-950 flex items-center justify-center p-2 relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, gray 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                    <div className="h-full w-full max-h-[calc(100vh-4rem)] max-w-[calc(100vh-4rem)] aspect-square shadow-2xl rounded overflow-hidden border-[12px] border-neutral-800 ring-1 ring-neutral-700">
                        <Chessboard options={{
                            position: fen,
                            onPieceDrag: onDrag,
                            onPieceDrop: onDrop,
                            boardOrientation: myColor === 'black' ? 'black' : 'white',
                            darkSquareStyle: { backgroundColor: '#779556' },
                            lightSquareStyle: { backgroundColor: '#ebecd0' },
                            animationDurationInMs: 200,
                        }} />
                    </div>
                </div>

            </div>
        </div>
    );
}

