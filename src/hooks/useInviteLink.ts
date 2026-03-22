import { useEffect } from "react";
import { useUserStore } from "../stores/userStore";
import { useMultiplayerStore } from "../stores/multiplayerGameStore";
import type { Screen } from "../types/Screen";

export function useInviteLink(navigate: (screen: Screen) => void) {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const lobby = params.get("lobby");

        if (!lobby) return;

        // Store lobbyId in MULTIPLAYER store
        useMultiplayerStore.getState().setLobbyId(lobby);

        // Clean URL
        window.history.replaceState({}, "", window.location.pathname);

        let prevUserId = useUserStore.getState().userId;

        const unsub = useUserStore.subscribe((state) => {
            const userId = state.userId;
            const isGuest = state.provider === "guest";

            // User logged in or changed
            if (userId && userId !== prevUserId) {
                if (isGuest) {
                    navigate("login");
                    unsub();
                    return;
                }

                navigate("private");
                unsub();
            }

            prevUserId = userId;
        });
    }, [navigate]);
}