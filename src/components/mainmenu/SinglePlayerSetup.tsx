import { useState } from "react";
import type { Screen } from "../../types/Screen";
import { useGameStore } from "../../stores/gameStore";

export function SinglePlayerSetup({
    onNavigate,
    onStart
}: {
    onNavigate: (screen: Screen) => void
    onStart: () => void;
}) {

    const singleInitializeGame = useGameStore(s => s.singleInitializeGame);

    // Local UI state (correct for new architecture)
    const [cpuDifficulty, setCpuDifficulty] = useState<"easy" | "normal" | "hard">("normal");
    const [cpuCount] = useState(3);

    const handleStart = () => {
        singleInitializeGame(cpuCount, cpuDifficulty);
        onStart();
    };

    return (
        <div
            className="
        relative flex flex-col items-center justify-center
        w-full h-screen text-[var(--theme-text)]
        overflow-hidden
        bg-[var(--theme-bg)]
    "
        >
            {/* Felt */}
            <div className="absolute inset-0 opacity-[0.22] bg-[url('/felt.png')] bg-cover pointer-events-none" />

            {/* Spotlight */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `
                radial-gradient(
                    circle at 50% 25%,
                    rgba(255,255,255,0.18) 0%,
                    rgba(0,0,0,0.75) 65%
                )
            `,
                }}
            />

            {/* Vignette */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `
                radial-gradient(
                    circle at center,
                    rgba(0,0,0,0) 55%,
                    rgba(0,0,0,0.55) 100%
                )
            `,
                }}
            />

            {/* Title */}
            <div className="relative mb-10">
                <div className="absolute inset-0 blur-[40px] opacity-30 bg-[var(--theme-accent)]"></div>
                <h2 className="relative text-5xl font-extrabold tracking-widest text-[var(--theme-accent)] drop-shadow-[0_0_15px_rgba(0,0,0,0.7)]">
                    SINGLE PLAYER
                </h2>
            </div>

            {/* Card Table Panel */}
            <div
                className="
            relative z-10 flex flex-col items-center gap-8
            bg-[var(--theme-surface)]/35 backdrop-blur-xl
            border border-[var(--theme-accent)]/40
            rounded-2xl px-10 py-8
            shadow-[0_0_25px_rgba(0,0,0,0.45)]
        "
            >
                <h3 className="text-xl font-semibold text-[var(--theme-text)] tracking-wide">
                    CPU Difficulty
                </h3>

                <div className="flex gap-4">
                    {["easy", "normal", "hard"].map(level => (
                        <button
                            key={level}
                            onClick={() => setCpuDifficulty(level as "easy" | "normal" | "hard")}
                            className={`
                        px-6 py-2.5 rounded-lg border-[2px] font-semibold tracking-wide
                        transition-all duration-200
                        ${cpuDifficulty === level
                                    ? "bg-[var(--theme-accent)] text-black border-[var(--theme-accent)] shadow-[0_0_12px_var(--theme-accent)]"
                                    : "bg-[var(--theme-surface)]/70 text-[var(--theme-text)] border-[var(--theme-accent)]/60 hover:opacity-100"
                                }
                    `}
                        >
                            {level.charAt(0).toUpperCase() + level.slice(1)}
                        </button>
                    ))}
                </div>

                <button className="w-48 menu-btn" onClick={handleStart}>
                    Start Game
                </button>

                <button
                    className="w-48 menu-btn opacity-70 hover:opacity-100"
                    onClick={() => onNavigate("play")}
                >
                    ← Back
                </button>
            </div>
        </div>
    );
}