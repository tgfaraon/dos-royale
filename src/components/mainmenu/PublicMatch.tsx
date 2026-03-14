import type { Screen } from "../../types/Screen";

export function PublicMatch({ onNavigate
}: {
    onNavigate: (screen: Screen) => void
}) {
    return (
        <div className="flex flex-col items-center gap-6 p-6 
                        bg-[var(--theme-surface)]/60 
                        rounded-xl border border-[var(--theme-accent)] 
                        shadow-[0_0_20px_rgba(0,0,0,0.4)] 
                        max-w-[420px] w-full mx-auto">

            <h2 className="mb-10 text-4xl font-bold">Public Match</h2>

            <p className="px-4 py-2 rounded-lg bg-[var(--theme-surface)]/60 
                          border border-[var(--theme-accent)] text-[var(--theme-text)] 
                          text-sm opacity-80 text-center">
                Matchmaking coming soon</p>

            <button className="opacity-70 hover:opacity-100" onClick={() => onNavigate("play")}>
                ← Back
            </button>
        </div>
    );
}