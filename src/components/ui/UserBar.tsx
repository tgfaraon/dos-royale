import { useUserStore } from "../../stores/userStore";
import { useUIStore } from "../../stores/uiStore";

export default function UserBar() {
    const username = useUserStore((s) => s.username);
    const avatarUrl = useUserStore((s) => s.avatarUrl);
    const provider = useUserStore((s) => s.provider);

    const setShowProfileModal = useUIStore((s) => s.setShowProfileModal);
    const setScreen = useUIStore((s) => s.setScreen);

    const avatar =
        avatarUrl || "https://api.dicebear.com/7.x/thumbs/svg?seed=player";

    return (
        <div
            className="
                absolute top-4 left-4
                flex items-center gap-3
                px-4 py-2
                rounded-xl
                bg-[var(--theme-surface)]
                text-[var(--theme-text)]
                shadow-lg shadow-black/40
                border border-[var(--theme-accent)]/40
                backdrop-blur-sm
                z-50
            "
        >
            {/* Avatar */}
            <img
                src={avatar}
                alt="avatar"
                className="w-10 h-10 rounded-full border-2 border-[var(--theme-accent)] object-cover"
            />

            {/* Username + provider */}
            <div className="flex flex-col leading-tight">
                <span className="text-lg font-bold">{username || "Player"}</span>
                <span className="text-xs capitalize opacity-70">{provider}</span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 ml-2">
                {/* Profile Button */}
                <button
                    className="
                        px-3 py-1
                        rounded-md
                        bg-[var(--theme-accent)]
                        text-[var(--theme-text)]
                        text-sm font-semibold
                        hover:opacity-90 transition
                    "
                    onClick={() => setShowProfileModal(true)}
                >
                    Profile
                </button>

                {/* Leaderboard Button */}
                <button
                    className="
                        px-3 py-1
                        rounded-md
                        bg-[var(--theme-accent)]
                        text-[var(--theme-text)]
                        text-sm font-semibold
                        hover:opacity-90 transition
                    "
                    onClick={() => setScreen("leaderboard")}
                >
                    Leaderboard
                </button>
            </div>
        </div>
    );
}