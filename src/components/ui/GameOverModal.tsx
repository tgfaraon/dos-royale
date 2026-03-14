interface GameOverModalProps {
    winner: number | null;
    onPlayAgain: () => void;
    onLeaveLobby?: () => void;
    isMultiplayer?: boolean;
}

export function GameOverModal({ winner, onPlayAgain, onLeaveLobby, isMultiplayer }: GameOverModalProps) {
    if (winner === null) return null;

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="
                bg-[var(--theme-surface)]
                border-[var(--theme-accent)]
                rounded-xl
                p-6
                w-80
                text-center
                shadow-[0_0_20px_var(--theme-accent)]
            ">

                <h2 className="
                    text-3xl
                    font-[Neonderthaw]
                    text-[var(--theme-accent)]
                    [text-shadow:2px_2px_0_#000]
                    mb-4
                ">
                    Dos <span className="text-[var(--theme-accent)]">♦</span> Royale
                </h2>

                <p className="mb-6 text-lg text-[var(--theme-text)]">
                    Player {winner} wins!
                </p>

                {/* --- Play Again --- */}
                <button
                    onClick={onPlayAgain}
                    className="
                        bg-[var(--theme-accent)]
                        text-[var(--theme-text)]
                        px-4 py-2
                        rounded-lg
                        w-full
                        font-semibold
                        shadow-[0_0_10px_rgba(0,0,0,0.4)]
                        hover:brightness-110
                        active:brightness-90
                        transition-all
                        mb-3
                    "
                >
                    Play Again
                </button>

                {/* --- Leave Lobby (multiplayer only) --- */}
                {isMultiplayer && onLeaveLobby && (
                    <button
                        onClick={onLeaveLobby}
                        className="
                            bg-[#444]
                            text-white
                            px-4 py-2
                            rounded-lg
                            w-full
                            font-semibold
                            shadow-[0_0_10px_rgba(0,0,0,0.4)]
                            hover:brightness-110
                            active:brightness-90
                            transition-all
                        "
                    >
                        Leave Lobby
                    </button>
                )}
            </div>
        </div>
    );
}