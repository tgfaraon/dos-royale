import type { Screen } from "../../types/Screen";

export default function LobbyFullScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
    return (
        <div
            className="
                relative
                flex flex-col items-center justify-center
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
            {/* Felt texture */}
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

            {/* Center card */}
            <div className="relative z-10 flex flex-col items-center px-8 py-10 text-center border shadow-xl rounded-xl bg-black/40 backdrop-blur-md border-white/10">
                <div className="absolute inset-0 blur-[30px] opacity-20 bg-[var(--theme-accent)] rounded-xl"></div>

                <h1 className="relative text-3xl font-extrabold tracking-wider text-[var(--theme-accent)] drop-shadow-[0_0_10px_rgba(0,0,0,0.6)] mb-4">
                    LOBBY FULL
                </h1>

                <p className="relative max-w-xs mb-8 leading-relaxed text-white/90">
                    This lobby already has the maximum number of players.
                </p>

                <button
                    onClick={() => onNavigate("menu")}
                    className="
                        relative
                        px-6 py-3
                        rounded-lg
                        font-semibold
                        tracking-wide
                        bg-[var(--theme-accent)]
                        text-black
                        shadow-[0_0_10px_rgba(0,0,0,0.4)]
                        hover:brightness-110
                        transition
                    "
                >
                    Return to Menu
                </button>
            </div>
        </div>
    );
}