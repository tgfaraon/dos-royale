import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { useUserStore } from "./stores/userStore";
import { useGameStore } from "./stores/gameStore";
import { useThemeStore } from "./stores/themeStore";

import { getAuth, onAuthStateChanged } from "firebase/auth";

function Root() {
  const setUser = useUserStore((s) => s.setUser);

  // Firebase Auth listener — hydrate Zustand when user logs in
  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        console.log("No Firebase user — showing login modal.");
        return;
      }

      console.log("Firebase user loaded:", user.uid);

      setUser({
        userId: user.uid,
        username: user.displayName || user.email?.split("@")[0] || "Player",
        avatarUrl: user.photoURL,
        provider: user.providerData[0]?.providerId || "unknown",
      });
    });

    return () => unsubscribe();
  }, [setUser]);

  // Handle deep link invite URLs
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
  // Expose Zustand stores for debugging
  // @ts-ignore
  window.useUserStore = useUserStore;
  // @ts-ignore
  window.useGameStore = useGameStore;
  // @ts-ignore
  window.useThemeStore = useThemeStore;
}

export { };

ReactDOM.createRoot(document.getElementById("root")!).render(<Root />);