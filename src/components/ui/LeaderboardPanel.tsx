import { useEffect, useState } from "react";
import { fetchTopLeaderboard } from "../../stores/leaderboardStore";
import { useThemeStore } from "../../stores/themeStore";

interface LeaderboardEntry {
    id: string;
    username: string;
    wins: number;
    losses: number;
    gamesPlayed: number;
}

export function LeaderboardPanel({ onBack }: { onBack: () => void }) {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const themeVars = useThemeStore(s => s.themes[s.theme].vars);

    useEffect(() => {
        fetchTopLeaderboard().then((data) => {
            setEntries(data as LeaderboardEntry[]);
        });
    }, []);

    return (
        <div
            className="
                relative
                flex items-center justify-center
                w-full h-screen
                text-[var(--theme-text)]
                overflow-hidden
            "
            style={{
                background: `
                    radial-gradient(
                        circle at center,
                        rgba(255,255,255,0.08) 0%,
                        rgba(0,0,0,0.4) 60%
                    ),
                    var(--theme-bg)
                `
            }}
        >
            {/* Felt texture (static) */}
            <div className="absolute inset-0 opacity-[0.15] bg-[url('/felt.png')] bg-cover pointer-events-none"></div>

            {/* Spotlight */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `
                        radial-gradient(
                            circle at 50% 20%,
                            rgba(255,255,255,0.12) 0%,
                            rgba(0,0,0,0.75) 60%
                        )
                    `
                }}
            />

            {/* Felt texture (theme-based) */}
            <div
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}felt/felt.png)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
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
                            rgba(0,0,0,0.35) 100%
                        )
                    `
                }}
            />

            {/* Foreground content */}
            <div className="relative z-10 flex items-center justify-center w-full h-full px-4 py-8">
                <div
                    className="flex flex-col w-full max-w-xl p-6 border shadow-xl rounded-2xl shadow-black/40"
                    style={{
                        background: themeVars["--theme-surface"],
                        borderColor: themeVars["--theme-accent"]
                    }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2
                            className="text-3xl font-bold tracking-wide"
                            style={{ color: themeVars["--theme-accent"] }}
                        >
                            Leaderboard
                        </h2>

                        <button
                            onClick={onBack}
                            className="px-4 py-2 font-semibold transition rounded-lg hover:opacity-90"
                            style={{
                                background: themeVars["--theme-accent"],
                                color: themeVars["--theme-bg"]
                            }}
                        >
                            Back
                        </button>
                    </div>

                    {/* Leaderboard List */}
                    <div className="flex-1 pr-2 overflow-y-auto">
                        {entries.length === 0 && (
                            <div
                                className="w-full p-6 text-center border rounded-xl opacity-80"
                                style={{
                                    background: themeVars["--theme-bg"] + "40",
                                    borderColor: themeVars["--theme-accent"] + "40"
                                }}
                            >
                                No games recorded yet.
                            </div>
                        )}

                        {entries.length > 0 && (
                            <ul className="space-y-3">
                                {entries.map((e, i) => (
                                    <li
                                        key={e.id}
                                        className="flex items-center justify-between p-4 border rounded-xl"
                                        style={{
                                            background: themeVars["--theme-bg"] + "40",
                                            borderColor: themeVars["--theme-accent"] + "40"
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span
                                                className="w-6 text-xl font-bold text-right"
                                                style={{ color: themeVars["--theme-accent"] }}
                                            >
                                                {i + 1}
                                            </span>

                                            <span className="font-semibold">{e.username}</span>
                                        </div>

                                        <div className="text-right opacity-80">
                                            <p>{e.wins} Wins</p>
                                            <p>{e.gamesPlayed} Games</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}