import { useUserStore } from "../../stores/userStore";

export default function ProfileModal({
    onClose,
    onChangeUsername,
}: {
    onClose: () => void;
    onChangeUsername: () => void;
}) {
    const username = useUserStore((s) => s.username);
    const avatarUrl = useUserStore((s) => s.avatarUrl);
    const provider = useUserStore((s) => s.provider);
    const logout = useUserStore((s) => s.logout);

    const avatar =
        avatarUrl || "https://api.dicebear.com/7.x/thumbs/svg?seed=player";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div
                className="
          bg-[var(--theme-surface)]
          text-[var(--theme-text)]
          border border-[var(--theme-accent)]/40
          shadow-xl shadow-black/50
          rounded-2xl
          p-6
          w-[90%] max-w-md
          relative
        "
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="
            absolute top-3 right-3
            text-[var(--theme-text)]
            opacity-70 hover:opacity-100
            text-xl font-bold
          "
                >
                    ×
                </button>

                {/* Avatar */}
                <div className="flex justify-center mb-4">
                    <img
                        src={avatar}
                        alt="avatar"
                        className="w-20 h-20 rounded-full border-4 border-[var(--theme-accent)] object-cover"
                    />
                </div>

                {/* Username */}
                <h2 className="text-center text-2xl font-bold mb-1">
                    {username || "Player"}
                </h2>

                {/* Provider */}
                <p className="text-center text-sm opacity-70 mb-6 capitalize">
                    {provider}
                </p>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onChangeUsername}
                        className="
              w-full py-2
              rounded-lg
              bg-[var(--theme-accent)]
              text-[var(--theme-text)]
              font-semibold
              hover:opacity-90 transition
            "
                    >
                        Change Username
                    </button>

                    <button
                        onClick={logout}
                        className="
              w-full py-2
              rounded-lg
              bg-red-600
              text-white
              font-semibold
              hover:bg-red-700 transition
            "
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}