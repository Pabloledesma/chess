import React from 'react';

function PlayerCard({ player, timer, isActive, isTurnToMove }) {
    // Formatear tiempo mm:ss
    const minutes = Math.floor(timer / 60);
    const seconds = Math.floor(timer % 60);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (!player) {
        return (
            <div className="bg-neutral-800/50 border border-neutral-700 border-dashed rounded-xl p-4 flex items-center justify-center h-24">
                <span className="text-neutral-500 italic">Esperando jugador...</span>
            </div>
        );
    }

    return (
        <div className={`relative p-4 rounded-xl border transition-all duration-300 ${isActive
                ? 'bg-neutral-800 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                : 'bg-neutral-900 border-neutral-800 opacity-80'
            }`}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="text-3xl bg-neutral-950 w-12 h-12 flex items-center justify-center rounded-full border border-neutral-700 shadow-inner">
                        {player.avatar}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg leading-none">{player.name}</h3>
                        <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                            {/* Mostrar color si decidimos pasarlo */}
                        </span>
                    </div>
                </div>

                {/* Timer Digital */}
                <div className={`font-mono text-3xl tabular-nums font-bold ${timer < 60 ? 'text-red-500 animate-pulse' : 'text-neutral-200'
                    }`}>
                    {timeStr}
                </div>
            </div>

            {isActive && (
                <div className="absolute top-0 right-0 -mt-1 -mr-1">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                    </span>
                </div>
            )}
        </div>
    );
}

export default function GameInfo({ players, timers, turnActive, myColor, onStartGame, onSwitchTurn, gameStarted }) {
    // turnActive es 'white' o 'black'

    // Determinar si es mi turno de pulsar el reloj
    // Regla: "Despues de que un jugador mueva la ficha debe apretar el boton para dar inicio al turno del siguiente jugador."
    // Significa: Si turnActive es 'white', el reloj de White corre. White debe pulsar para pasar a Black.
    const isMyTurnToSwitch = gameStarted && turnActive === myColor;

    return (
        <div className="flex flex-col gap-4 w-full">
            {/* Player Cards */}
            <PlayerCard
                player={players.black}
                timer={timers.black}
                isActive={turnActive === 'black'}
            />

            {/* Central Controls */}
            <div className="flex items-center justify-center py-2 min-h-[80px]">
                {!gameStarted ? (
                    <button
                        onClick={onStartGame}
                        className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg shadow-lg hover:shadow-green-500/20 transition-all text-xl uppercase tracking-wide"
                    >
                        Iniciar Partida
                    </button>
                ) : (
                    <button
                        onClick={onSwitchTurn}
                        disabled={!isMyTurnToSwitch}
                        className={`
                    px-8 py-4 rounded-xl font-black text-2xl uppercase tracking-wider shadow-2xl transition-all border-b-4 active:border-b-0 active:translate-y-1
                    ${isMyTurnToSwitch
                                ? 'bg-red-600 border-red-800 hover:bg-red-500 text-white shadow-red-900/50 cursor-pointer animate-bounce'
                                : 'bg-neutral-800 border-neutral-900 text-neutral-600 cursor-not-allowed opacity-50'
                            }
                `}
                    >
                        ⏱️ Finalizar Turno
                    </button>
                )}
            </div>

            <PlayerCard
                player={players.white}
                timer={timers.white}
                isActive={turnActive === 'white'}
            />
        </div>
    );
}
