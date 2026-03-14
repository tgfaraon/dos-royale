import { create } from "zustand";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    signInWithPopup,
    GoogleAuthProvider,
    GithubAuthProvider,
    OAuthProvider,
} from "firebase/auth";

interface UserState {
    userId: string | null;
    username: string | null;
    avatarUrl: string | null;
    provider: string | null;
    isLoggedIn: boolean;

    setUser: (data: {
        userId: string;
        username: string;
        avatarUrl?: string | null;
        provider: string;
    }) => void;

    loginWithProvider: (providerId: string) => Promise<void>;
    registerWithEmail: (email: string, password: string) => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    loginAsGuest: () => void;
    logout: () => Promise<void>;
}

export const useUserStore = create<UserState>()((set) => ({
    userId: null,
    username: null,
    avatarUrl: null,
    provider: null,
    isLoggedIn: false,

    setUser: ({ userId, username, avatarUrl, provider }) =>
        set({
            userId,
            username,
            avatarUrl: avatarUrl ?? null,
            provider,
            isLoggedIn: true,
        }),

    loginWithProvider: async (providerId: string) => {
        const auth = getAuth();
        let provider;

        switch (providerId) {
            case "google":
                provider = new GoogleAuthProvider();
                break;
            case "github":
                provider = new GithubAuthProvider();
                break;
            case "apple":
                provider = new OAuthProvider("apple.com");
                break;
            case "facebook":
                provider = new OAuthProvider("facebook.com");
                break;
            case "twitter":
                provider = new OAuthProvider("twitter.com");
                break;
            default:
                throw new Error("Unsupported provider: " + providerId);
        }

        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        set({
            userId: user.uid,
            username: user.displayName || user.email?.split("@")[0] || "Player",
            avatarUrl: user.photoURL,
            provider: providerId,
            isLoggedIn: true,
        });
    },

    registerWithEmail: async (email: string, password: string) => {
        const auth = getAuth();
        const result = await createUserWithEmailAndPassword(auth, email, password);

        set({
            userId: result.user.uid,
            username: email.split("@")[0],
            avatarUrl: null,
            provider: "email",
            isLoggedIn: true,
        });
    },

    loginWithEmail: async (email: string, password: string) => {
        const auth = getAuth();
        const result = await signInWithEmailAndPassword(auth, email, password);

        set({
            userId: result.user.uid,
            username: email.split("@")[0],
            avatarUrl: null,
            provider: "email",
            isLoggedIn: true,
        });
    },

    loginAsGuest: () =>
        set({
            userId: crypto.randomUUID(),
            username: "Guest",
            avatarUrl: null,
            provider: "guest",
            isLoggedIn: true,
        }),

    logout: async () => {
        const auth = getAuth();
        await signOut(auth);

        set({
            userId: null,
            username: null,
            avatarUrl: null,
            provider: null,
            isLoggedIn: false,
        });
    },
}));