import type { Screen } from "../../types/Screen";
import { useGameStore } from "../../stores/gameStore";
import { useUserStore } from "../../stores/userStore";

interface PlayMenuProps {
    onNavigate: (screen: Screen) => void;
    setMode: (mode: "single" | "private" | "public") => void;
}

export function PlayMenu({ onNavigate, setMode }: PlayMenuProps) {

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

            {/* Felt */}
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

            {/* Title */}
            <div className="relative">
                <div className="absolute inset-0 blur-[30px] opacity-20 bg-[var(--theme-accent)]"></div>
                <h2 className="relative text-4xl font-extrabold tracking-widest text-[var(--theme-accent)] drop-shadow-[0_0_10px_rgba(0,0,0,0.6)] mb-10">
                    PLAY
                </h2>
            </div>

            {/* Options */}
            <div className="flex flex-col w-64 gap-4">
                <button className="menu-btn"
                    onClick={() => {
                        setMode("single");
                        onNavigate("single");
                    }}
                >
                    Single Player
                </button>

                <button className="menu-btn"
                    onClick={() => {
                        const userId = useUserStore.getState().userId;
                        if (!userId) return;

                        const newLobbyId = crypto.randomUUID();
                        console.log("SETTING NEW LOBBY ID:", newLobbyId);

                        const username = useUserStore.getState().username ?? "";
                        const avatarUrl = useUserStore.getState().avatarUrl;

                        // Set everything synchronously BEFORE navigating
                        useGameStore.getState().setLobbyId(newLobbyId);
                        useGameStore.getState().setHostId(userId);
                        useGameStore.getState().setPlayers([
                            {
                                id: userId,
                                username,
                                avatarUrl,
                                ready: false,
                            }
                        ]);

                        setMode("private");
                        onNavigate("private");
                    }}
                >
                    Private Match
                </button>


                <button className="menu-btn"
                    onClick={() => {
                        setMode("public");
                        onNavigate("public");
                    }}
                >
                    Public Match
                </button>
            </div>

            {/* Back */}
            <button
                className="mt-10 text-sm tracking-wide transition opacity-70 hover:opacity-100"
                onClick={() => onNavigate('menu')}
            >
                ← Back
            </button>
        </div>
    );
}