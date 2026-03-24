import type { Screen } from "../../types/Screen";
import { MenuScene } from "./MenuScene";

export function MainMenu({
    onNavigate
}: {
    onNavigate: (screen: Screen) => void
}) {
    return (
        <div
            className="
        w-full min-h-screen
        flex flex-col items-center justify-center
        text-[var(--theme-text)]
        relative 
        overflow-hidden
        animate-fadeIn
        sm:h-screen
    "
            style={{
                background: ` 
                    radial-gradient( 
                        circle at center, 
                        rgba(255,255,255,0.06) 0%, 
                        rgba(0,0,0,0.4) 60% 
                    ), 
                    var(--theme-bg) `
            }}
        >
            <MenuScene />
            {/* Felt texture overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('/felt.png')] bg-cover pointer-events-none"></div>

            {/* Content */}
            <div
                className="
                    relative z-10 flex flex-col items-center

                    /* Mobile: place title right under UserBar */
                     mt-8

                    /* Desktop: restore original dramatic spacing */
                    sm:mt-[-120px] lg:mt-[-180px]
                "
            >
                <h1
                    className=" 
                        text-4xl sm:text-5xl font-extrabold tracking-widest mb-12
                        text-[var(--theme-accent)]
                        drop-shadow-[0_0_12px_rgba(0,0,0,0.6)]
                    "
                >
                    DOS <span className="text-[var(--theme-accent)]">♦</span> ROYALE
                </h1>

                <div className="flex flex-col w-56 gap-3 sm:w-64 sm:gap-4">
                    <button className="menu-btn" onClick={() => onNavigate("play")}>
                        Play
                    </button>
                    <button className="menu-btn" onClick={() => onNavigate("settings")}>
                        Settings
                    </button>
                    <button className="menu-btn" onClick={() => onNavigate("howto")}>
                        How to Play
                    </button>
                    <button className="menu-btn" onClick={() => onNavigate("credits")}>
                        Credits
                    </button>
                </div>
            </div>
        </div>
    );
}