import type { Screen } from "../../types/Screen";

export function Credits({ onNavigate
}: {
    onNavigate: (screen: Screen) => void
}) {
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
                    PUBLIC MATCH
                </h2>
            </div>

            {/* Floating Card */}
            <div
                className=" 
                    relative z-10 flex flex-col items-center gap-6
                    bg-[var(--theme-surface)]/40 backdrop-blur-md
                    border border-[var(--theme-accent)]/40
                    rounded-xl px-8 py-6 shadow-[0_0_20px_rgba(0,0,0,0.4)]
                "
            >
                <h2 className="mb-10 text-4xl font-bold">Credits</h2>

                <p className="mb-6 opacity-80">Designed & developed by Tyler G. Faraon</p>

                <button className="opacity-70 hover:opacity-100" onClick={() => onNavigate("menu")}>
                    ← Back
                </button>
            </div>
        </div>
    );
}