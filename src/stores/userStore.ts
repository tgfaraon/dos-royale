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
  signInAnonymously,
} from "firebase/auth";

import { db } from "../lib/firebase";
import {
  ref,
  get as dbGet,
  runTransaction,
  set as dbSet,
} from "firebase/database";

interface UserState {
  userId: string | null;
  username: string | null;
  avatarUrl: string | null;
  provider: string | null; // "guest", "developer", "demo", "google", etc.
  isLoggedIn: boolean;

  checkingUsername: boolean;
  usernameAvailable: boolean | null;
  usernameError: string;

  setUser: (data: {
    userId: string;
    username: string | null;
    avatarUrl?: string | null;
    provider: string;
  }) => void;

  checkUsernameAvailability: (username: string) => Promise<void>;
  claimUsername: (userId: string, username: string) => Promise<boolean>;

  hydrateUser: () => Promise<void>;

  loginWithProvider: (providerId: string) => Promise<void>;
  registerWithEmail: (email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;

  loginAsGuest: () => void;
  loginAsDeveloper: () => Promise<void>;
  loginAsDemo: () => Promise<void>;

  logout: () => Promise<void>;
}

export const useUserStore = create<UserState>()((set) => ({
  userId: null,
  username: null,
  avatarUrl: null,
  provider: null,
  isLoggedIn: false,

  checkingUsername: false,
  usernameAvailable: null,
  usernameError: "",

  setUser: ({ userId, username, avatarUrl, provider }) =>
    set({
      userId,
      username,
      avatarUrl: avatarUrl ?? null,
      provider,
      isLoggedIn: true,
    }),

  // --------------------------------------------------
  // USERNAME AVAILABILITY CHECK
  // --------------------------------------------------
  checkUsernameAvailability: async (username: string) => {
    set({ checkingUsername: true, usernameError: "" });

    const snapshot = await dbGet(ref(db, `usernames/${username}`));
    const available = !snapshot.exists();

    set({
      checkingUsername: false,
      usernameAvailable: available,
      usernameError: available ? "" : "Username is taken",
    });
  },

  // --------------------------------------------------
  // CLAIM USERNAME (ATOMIC + FULL SYNC)
  // --------------------------------------------------
  claimUsername: async (userId: string, username: string) => {
    const usernameRef = ref(db, `usernames/${username}`);
    const userRef = ref(db, `users/${userId}/username`);

    const result = await runTransaction(usernameRef, (current) => {
      if (current === null) return userId;
      return;
    });

    if (!result.committed) {
      set({ usernameError: "Username already taken" });
      return false;
    }

    await dbSet(userRef, username);

    set({ username });

    return true;
  },

  // --------------------------------------------------
  // HYDRATE USER FROM FIREBASE ON APP LOAD
  // --------------------------------------------------
  hydrateUser: async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const usernameSnap = await dbGet(ref(db, `users/${user.uid}/username`));
    const savedUsername = usernameSnap.exists() ? usernameSnap.val() : null;

    // Preserve provider role if possible
    const providerId =
      user.providerData[0]?.providerId ??
      (user.isAnonymous ? "developer" : null);

    set({
      userId: user.uid,
      username: savedUsername,
      avatarUrl: user.photoURL,
      provider: providerId,
      isLoggedIn: true,
    });
  },

  // --------------------------------------------------
  // OAUTH PROVIDERS
  // --------------------------------------------------
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
      case "microsoft":
        provider = new OAuthProvider("microsoft.com");
        break;
      default:
        throw new Error("Unsupported provider: " + providerId);
    }

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    const usernameSnap = await dbGet(ref(db, `users/${user.uid}/username`));
    const savedUsername = usernameSnap.exists() ? usernameSnap.val() : null;

    set({
      userId: user.uid,
      username: savedUsername,
      avatarUrl: user.photoURL,
      provider: providerId,
      isLoggedIn: true,
    });
  },

  // --------------------------------------------------
  // EMAIL AUTH
  // --------------------------------------------------
  registerWithEmail: async (email: string, password: string) => {
    const auth = getAuth();
    const result = await createUserWithEmailAndPassword(auth, email, password);

    set({
      userId: result.user.uid,
      username: null,
      avatarUrl: null,
      provider: "email",
      isLoggedIn: true,
    });
  },

  loginWithEmail: async (email: string, password: string) => {
    const auth = getAuth();
    const result = await signInWithEmailAndPassword(auth, email, password);

    const usernameSnap = await dbGet(
      ref(db, `users/${result.user.uid}/username`)
    );
    const savedUsername = usernameSnap.exists() ? usernameSnap.val() : null;

    set({
      userId: result.user.uid,
      username: savedUsername,
      avatarUrl: null,
      provider: "email",
      isLoggedIn: true,
    });
  },

  // --------------------------------------------------
  // GUEST LOGIN (restricted)
  // --------------------------------------------------
  loginAsGuest: () =>
    set({
      userId: crypto.randomUUID(),
      username: "Guest",
      avatarUrl: null,
      provider: "guest",
      isLoggedIn: true,
    }),

  // --------------------------------------------------
  // DEVELOPER LOGIN (full access, anonymous auth)
  // --------------------------------------------------
  loginAsDeveloper: async () => {
    const auth = getAuth();
    const result = await signInAnonymously(auth);

    set({
      userId: result.user.uid,
      username: "Developer",
      avatarUrl: null,
      provider: "developer",
      isLoggedIn: true,
    });
  },

  // --------------------------------------------------
  // DEMO LOGIN (for recruiters)
  // --------------------------------------------------
  loginAsDemo: async () => {
    const auth = getAuth();
    const result = await signInAnonymously(auth);

    set({
      userId: result.user.uid,
      username: "Demo User",
      avatarUrl: null,
      provider: "demo",
      isLoggedIn: true,
    });
  },

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------
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