import { useState } from "react";
import { useUserStore } from "../../stores/userStore";

const providers = [
    { id: "google", label: "Continue with Google" },
    { id: "facebook", label: "Continue with Facebook" },
    { id: "apple", label: "Continue with Apple (In-progress)" },
    { id: "github", label: "Continue with GitHub" },
    { id: "microsoft", label: "Continue with Microsoft" },
];

export default function LoginModal() {
    const loginWithProvider = useUserStore((s) => s.loginWithProvider);
    const loginAsGuest = useUserStore((s) => s.loginAsGuest);
    const setUser = useUserStore((s) => s.setUser);

    const [errorMessage, setErrorMessage] = useState("");

    const handleProviderLogin = async (providerId: string) => {
        setErrorMessage("");

        try {
            await loginWithProvider(providerId);
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };

            // Normalize Firebase error messages
            if (error.code === "auth/account-exists-with-different-credential") {
                setErrorMessage(
                    "This email is already linked to another login method. Please sign in using the provider you originally used."
                );
            } else {
                setErrorMessage(error.message || "Something went wrong during login.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="bg-[var(--theme-surface)]/40 border border-[var(--theme-accent)] rounded-xl p-8 w-[90%] max-w-md shadow-xl text-center">

                <h2 className="text-2xl font-bold text-[var(--theme-text)] mb-6">
                    Welcome to Dos Royale
                </h2>

                <p className="text-[var(--theme-text)]/80 mb-6">
                    Log in to access multiplayer, leaderboards, and more.
                </p>

                {errorMessage && (
                    <div className="p-3 mb-4 text-sm text-red-300 rounded bg-red-500/20">
                        {errorMessage}
                    </div>
                )}

                <div className="flex flex-col gap-3 mb-6">
                    {providers.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => handleProviderLogin(p.id)}
                            className="w-full py-3 rounded-lg bg-[var(--theme-accent)] text-[var(--theme-text)] font-semibold hover:opacity-90 transition"
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <div className="mt-4">
                    <button
                        onClick={loginAsGuest}
                        className="text-[var(--theme-accent)] underline hover:opacity-80"
                    >
                        Continue as Guest
                    </button>

                    <p className="text-xs text-[var(--theme-text)]/60 mt-2">
                        Guest accounts cannot access multiplayer or leaderboards.
                    </p>
                </div>

                {import.meta.env.DEV && (
                    <div className="mt-6">
                        <button
                            onClick={() =>
                                setUser({
                                    userId: "dev-user",
                                    username: "Developer",
                                    avatarUrl: null,
                                    provider: "dev",
                                })
                            }
                            className="text-xs text-[var(--theme-text)]/60 underline hover:opacity-80"
                        >
                            Dev Login (Skip Authentication)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}