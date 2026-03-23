import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ref, get } from "firebase/database";
import { db } from "./lib/firebase";

import { useUserStore } from "./stores/userStore.ts";
import { useSingleplayerStore } from "./stores/singleplayerGameStore";
import { useMultiplayerStore } from "./stores/multiplayerGameStore";
import { useThemeStore } from "./stores/themeStore";

import { getAuth, onAuthStateChanged } from "firebase/auth";

function Root() {
  const setUser = useUserStore((s) => s.setUser);

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        console.log("No Firebase user — showing login modal.");
        return;
      }

      console.log("Firebase user loaded:", user.uid);

      // Load username from Realtime Database
      const userRef = ref(db, `users/${user.uid}`);
      const snap = await get(userRef);

      let username = "Player";

      if (snap.exists()) {
        username = snap.val().username; // ← this is "gaige"
      } else {
        // fallback if DB entry missing
        username = user.displayName || user.email?.split("@")[0] || "Player";
      }

      setUser({
        userId: user.uid,
        username,
        avatarUrl: user.photoURL,
        provider: user.providerData[0]?.providerId || "unknown",
      });
    });

    return () => unsubscribe();
  }, [setUser]);

  useEffect(() => {
    function handleDeepLink() {
      const url = window.location.href;

      if (url.includes("/invite/")) {
        const lobbyId = url.split("/invite/")[1];
        localStorage.setItem("pending-lobby", lobbyId);
      }
    }
    handleDeepLink();
  }, []);

  return <App />;
}

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.useUserStore = useUserStore;
  // @ts-expect-error
  window.useSingleplayerStore = useSingleplayerStore;
  // @ts-expect-error
  window.useMultiplayerStore = useMultiplayerStore;
  // @ts-expect-error
  window.useThemeStore = useThemeStore;
}

export { };

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);