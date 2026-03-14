import { useEffect, useRef, useState } from "react";
import { ref, onChildAdded, push, off, type DataSnapshot } from "firebase/database";
import { db } from "../lib/firebase";
import type { AuthoritativeGameState } from "../stores/gameStore";
import type { ThemeName } from "../stores/themeStore";
import type { Card as CardType } from "../game-engine/types";

export type LobbyEvent =
    | { type: "player-join"; player: { id: string; username: string; avatarUrl: string | null; ready: boolean }; isHost: boolean }
    | { type: "player-leave"; leavingPlayerId: string }
    | { type: "player-ready"; playerId: string; ready: boolean }
    | { type: "settings-update"; cpuCount: number; cpuDifficulty: "easy" | "normal" | "hard"; theme: ThemeName; turnTimer: number | null }
    | { type: "game-init"; state: AuthoritativeGameState }
    | { type: "lobby-sync"; state: AuthoritativeGameState }
    | { type: "turn-update"; state: AuthoritativeGameState }
    | { type: "round-end"; state: AuthoritativeGameState }
    | { type: "game-over"; state: AuthoritativeGameState }
    | { type: "play-request"; playerId: string; cards: CardType[] }
    | { type: "pass-request"; playerId: string };

export function useLobbyChannel(
    lobbyId: string | null,
    onEvent: (event: LobbyEvent) => void
) {
    const [ready, setReady] = useState(false);

    // Always point to the latest onEvent
    const eventHandlerRef = useRef(onEvent);
    useEffect(() => {
        eventHandlerRef.current = onEvent;
    }, [onEvent]);

    // Stable callback ref (initialized once)
    const stableCallbackRef = useRef<((snap: DataSnapshot) => void) | null>(null);

    useEffect(() => {
        if (stableCallbackRef.current == null) {
            stableCallbackRef.current = (snapshot: DataSnapshot) => {
                const event = snapshot.val();
                if (!event) return;

                setReady(true);
                eventHandlerRef.current(event as LobbyEvent);
            };
        }
    }, []); // initialize once

    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!lobbyId) return;

        const eventsRef = ref(db, `lobbies/${lobbyId}/events`);
        const stableCallback = stableCallbackRef.current!;

        // Subscribe
        onChildAdded(eventsRef, stableCallback);

        // Store unsubscribe
        unsubscribeRef.current = () => {
            off(eventsRef, "child_added", stableCallback);
        };

        // Cleanup
        return () => {
            off(eventsRef, "child_added", stableCallback);
        };
    }, [lobbyId]);

    function send(event: LobbyEvent) {
        if (!lobbyId) return;

        const eventsRef = ref(db, `lobbies/${lobbyId}/events`);
        const clean = JSON.parse(JSON.stringify(event));
        push(eventsRef, clean);
    }

    function unsubscribe() {
        unsubscribeRef.current?.();
    }

    return { send, ready, unsubscribe };
}    