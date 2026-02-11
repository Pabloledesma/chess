import React, { useRef, useEffect } from 'react';

export default function MoveHistory({ history }) {
    const scrollRef = useRef(null);

    // Auto-scroll to bottom on new move
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    // Agrupar movimientos en pares (Blanco, Negro)
    const movesPairs = [];
    for (let i = 0; i < history.length; i += 2) {
        movesPairs.push({
            white: history[i],
            black: history[i + 1] || '',
            number: Math.floor(i / 2) + 1
        });
    }

    return (
        <div className="flex flex-col h-full bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden">
            <div className="p-3 bg-neutral-900 border-b border-neutral-700">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="i-lucide-scroll-text"></span>
                    Historial
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-0" ref={scrollRef}>
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-neutral-400 uppercase bg-neutral-900 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 w-12">#</th>
                            <th className="px-4 py-2">White</th>
                            <th className="px-4 py-2">Black</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movesPairs.map((pair, index) => (
                            <tr key={index} className="border-b border-neutral-700 bg-neutral-800 hover:bg-neutral-750">
                                <td className="px-4 py-2 text-neutral-500 font-mono">{pair.number}.</td>
                                <td className="px-4 py-2 font-medium text-white">{pair.white}</td>
                                <td className="px-4 py-2 font-medium text-white">{pair.black}</td>
                            </tr>
                        ))}
                        {movesPairs.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-4 py-8 text-center text-neutral-500 italic">
                                    Sin movimientos aún
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
