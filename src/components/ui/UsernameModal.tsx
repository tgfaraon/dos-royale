import { useState } from "react";
import { useUserStore } from "../../stores/userStore";

interface UsernameModalProps {
    onClose: () => void;
}

export function UsernameModal({ onClose }: UsernameModalProps) {
    const userId = useUserStore((s) => s.userId);
    const checkUsernameAvailability = useUserStore((s) => s.checkUsernameAvailability);
    const claimUsername = useUserStore((s) => s.claimUsername);

    const checking = useUserStore((s) => s.checkingUsername);
    const available = useUserStore((s) => s.usernameAvailable);
    const error = useUserStore((s) => s.usernameError);

    const [username, setUsername] = useState("");

    const handleSubmit = async () => {
        if (!userId) return;

        // Step 1: check availability (updates Zustand state)
        await checkUsernameAvailability(username);

        // If unavailable, stop
        if (available === false) return;

        // Step 2: claim username
        const success = await claimUsername(userId, username);

        if (success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="relative bg-[#0f0f0f] border border-neutral-700 rounded-xl p-6 w-[340px] shadow-[0_0_25px_rgba(0,0,0,0.6)]">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-xl font-bold text-white opacity-70 hover:opacity-100"
                >
                    ×
                </button>

                <h2 className="mb-4 text-2xl font-bold tracking-wide text-center text-white">
                    Choose a Username
                </h2>

                <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                        setUsername(e.target.value.toLowerCase());
                    }}
                    placeholder="enter username"
                    className="w-full px-3 py-2 text-white border rounded-md bg-neutral-800 border-neutral-700 focus:outline-none focus:ring-2 focus:ring-red-600 placeholder-neutral-500"
                />

                {/* Availability + Error Messages */}
                <div className="mt-2 min-h-[20px] text-center">
                    {checking && <p className="text-sm text-neutral-400">Checking availability...</p>}
                    {available === true && <p className="text-sm text-green-500">Username is available</p>}
                    {available === false && <p className="text-sm text-red-500">Username is taken</p>}
                    {error && <p className="text-sm text-red-500">{error}</p>}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!username}
                    className={`
            w-full mt-4 py-2 rounded-md font-semibold tracking-wide transition
            ${username
                            ? "bg-red-600 hover:bg-red-700 text-white shadow-[0_0_10px_rgba(220,38,38,0.4)]"
                            : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                        }
          `}
                >
                    Confirm
                </button>

            </div>
        </div>
    );
}