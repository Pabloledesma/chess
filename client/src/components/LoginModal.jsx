import React, { useState } from 'react';

export default function LoginModal({ onSubmit }) {
    const [name, setName] = useState('');
    const [avatar, setAvatar] = useState('♟️');

    const avatars = ['♟️', '♞', '♝', '♜', '♛', '♚', '🦄', '🐲'];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit({ name, avatar });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-neutral-800 p-8 rounded-2xl shadow-2xl border border-neutral-700 w-full max-w-md">
                <h2 className="text-3xl font-bold text-white mb-6 text-center bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    Únete a la Partida
                </h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Tu Nombre</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-neutral-600"
                            placeholder="Ej: Pablo"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">Elige un Avatar</label>
                        <div className="grid grid-cols-4 gap-2">
                            {avatars.map((char) => (
                                <button
                                    key={char}
                                    type="button"
                                    onClick={() => setAvatar(char)}
                                    className={`text-2xl p-2 rounded-lg transition-all ${avatar === char
                                            ? 'bg-blue-600 text-white scale-110 shadow-lg ring-2 ring-blue-400'
                                            : 'bg-neutral-900 text-neutral-500 hover:bg-neutral-700 hover:text-white'
                                        }`}
                                >
                                    {char}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={!name.trim()}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Entrar al Juego
                    </button>
                </form>
            </div>
        </div>
    );
}
