import type { Screen } from "../../types/Screen";

export function HowToPlay({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
    return (
        <div
            className="
                relative flex flex-col items-center justify-center
                w-full h-screen text-[var(--theme-text)] overflow-hidden
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
            {/* Felt */}
            <div className="absolute inset-0 opacity-[0.15] bg-[url('/felt.png')] bg-cover pointer-events-none"></div>

            {/* Spotlight */}
            <div
                className="absolute inset-0"
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

            {/* Header */}
            <div className="relative mb-8">
                <div className="absolute inset-0 blur-[30px] opacity-20 bg-[var(--theme-accent)]"></div>
                <h2 className="relative text-4xl font-extrabold tracking-widest text-[var(--theme-accent)] drop-shadow-[0_0_10px_rgba(0,0,0,0.6)]">
                    HOW TO PLAY
                </h2>
            </div>

            {/* Floating Card */}
            <div
                className="
                    relative z-10 flex flex-col items-start gap-6
                    bg-[var(--theme-surface)]/40 backdrop-blur-md
                    border border-[var(--theme-accent)]/40
                    rounded-xl px-8 py-6 shadow-[0_0_20px_rgba(0,0,0,0.4)]
                    max-w-[700px] max-h-[70vh] overflow-y-auto
                "
            >
                <h2 className="mb-2 text-3xl font-bold">Game Rules</h2>

                {/* RULES CONTENT */}
                <div className="space-y-4 text-sm leading-relaxed opacity-90">

                    <div>
                        <h3 className="mb-1 text-xl font-semibold">Objective</h3>
                        <p>Be the first player to get rid of all your cards. Players take turns playing valid combos that beat the previous combo, or passing if they cannot or choose not to play.</p>
                    </div>

                    <div>
                        <h3 className="mb-1 text-xl font-semibold">Card Basics</h3>
                        <ul className="ml-5 space-y-1 list-disc">
                            <li>Standard 52‑card deck.</li>
                            <li>Rank order (low → high): <b>3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A, 2</b></li>
                            <li>Suit order (low → high): <b>Clubs, Diamonds, Hearts, Spades</b></li>
                            <li><b>3♣</b> determines the starting player.</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-1 text-xl font-semibold">Valid Combos</h3>

                        <p className="font-medium">Singles</p>
                        <p className="mb-2">Any single card. Must beat the previous single by rank (or suit if tied).</p>

                        <p className="font-medium">Pairs</p>
                        <p className="mb-2">Two cards of the same rank. Must beat the previous pair by rank (or suit of the highest card if tied).</p>

                        <p className="font-medium">Five‑Card Combos (low → high)</p>
                        <ul className="mb-2 ml-5 space-y-1 list-disc">
                            <li>Straight — 5 cards in sequence</li>
                            <li>Flush — 5 cards of the same suit</li>
                            <li>Full House — 3 of a kind + a pair</li>
                            <li>Four of a Kind (Bomb)</li>
                            <li>Straight Flush</li>
                        </ul>
                        <p>Higher categories beat lower ones. Within the same category, compare highest relevant card.</p>
                    </div>

                    <div>
                        <h3 className="mb-1 text-xl font-semibold">Turn Flow</h3>
                        <ul className="ml-5 space-y-1 list-disc">
                            <li>The player with <b>3♣</b> starts the first trick.</li>
                            <li>On your turn, you must play a valid combo or pass.</li>
                            <li>Once you pass, you cannot play again until the trick resets.</li>
                            <li>A trick resets when everyone except the last player has passed, or when a bomb is played.</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="mb-1 text-xl font-semibold">Winning</h3>
                        <p>The first player to empty their hand wins. CPUs continue playing until all placements are determined.</p>
                    </div>

                    <div>
                        <h3 className="mb-1 text-xl font-semibold">Turn Timer</h3>
                        <p>If enabled, players must act before the timer expires. Running out of time automatically counts as a pass.</p>
                    </div>

                    <div>
                        <h3 className="mb-1 text-xl font-semibold">CPU Behavior</h3>
                        <p>CPUs evaluate all valid combos and attempt to beat the current combo using the lowest winning option. If no valid play exists, they pass.</p>
                    </div>

                    <div>
                        <h3 className="mb-1 text-xl font-semibold">Themes</h3>
                        <p>Themes change the visual style only. They do not affect gameplay.</p>
                    </div>

                    <div>
                        <h3 className="mb-1 text-xl font-semibold">Private Match Rules</h3>
                        <ul className="ml-5 space-y-1 list-disc">
                            <li>The host controls CPU count, difficulty, theme, and turn timer.</li>
                            <li>Only the host can start the match.</li>
                            <li>All players must be marked Ready before the match begins.</li>
                        </ul>
                    </div>
                </div>

                <button className="mt-6 opacity-70 hover:opacity-100" onClick={() => onNavigate("menu")}>
                    ← Back
                </button>
            </div>
        </div>
    );
}
