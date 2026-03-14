import { useEffect } from "react";
import { useUserStore } from "../stores/userStore";
import { useGameStore } from "../stores/gameStore";
import type { Screen } from "../types/Screen";

export function useInviteLink(navigate: (screen: Screen) => void) {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const lobby = params.get("lobby");

        const lobbyId = useGameStore.getState().gameState.lobbyId;

        if (!lobby) return;

        // Store lobbyId immediately
        useGameStore.setState(state => ({
            gameState: {
                ...state.gameState,
                lobbyId
            }
        }));

        window.history.replaceState({}, "", window.location.pathname);

        let prevUserId = useUserStore.getState().userId;

        const unsub = useUserStore.subscribe((state) => {
            const userId = state.userId;
            const isGuest = state.provider === "guest";

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