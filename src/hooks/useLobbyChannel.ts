import { useEffect, useRef, useState } from "react";
import { ref, onChildAdded, push, off, type DataSnapshot } from "firebase/database";
import { db } from "../lib/firebase";

import type { MultiplayerState, PlayerInfo } from "../stores/multiplayerGameStore";
import type { ThemeName } from "../stores/themeStore";
import type { Card as CardType } from "../game-engine/types";

export type LobbyEvent =
    | { type: "player-join"; player: { id: string; username: string; avatarUrl: string | null; ready: boolean }; isHost: boolean }
    | { type: "player-leave"; leavingPlayerId: string }
    | { type: "player-ready"; playerId: string; ready: boolean }
    | { type: "settings-update"; cpuCount: number; cpuDifficulty: "easy" | "normal" | "hard"; theme: ThemeName; turnTimer: number | null }
    | { type: "game-init"; state: MultiplayerState }
    | {
        type: "game-init-lite";
        payload: {
            players: PlayerInfo[];
            cpuCount: number;
            cpuDifficulty: "easy" | "normal" | "hard";
            turnTimer: number | null;
            seed: string;
        };
    }
    | { type: "lobby-sync"; state: MultiplayerState }
    | { type: "turn-update"; state: MultiplayerState }
    | { type: "round-end"; state: MultiplayerState }
    | { type: "game-over"; state: MultiplayerState }
    | { type: "play-request"; playerId: string; cardIds: string[]; cards?: CardType[]; }
    | { type: "pass-request"; playerId: string }

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

                eventHandlerRef.current(event as LobbyEvent);
            };
        }
    }, []);

    useEffect(() => {
        if (!lobbyId) return;

        const eventsRef = ref(db, `lobbies/${lobbyId}/events`);

        let isInitialBatch = true;

        const wrappedCallback = (snapshot: DataSnapshot) => {
            const event = snapshot.val();
            if (!event) return;

            if (isInitialBatch) {
                return;
            }

            // Only process NEW events
            eventHandlerRef.current(event as LobbyEvent);
        };

        // Subscribe
        onChildAdded(eventsRef, wrappedCallback);

        // After Firebase finishes replaying existing events,
        // flip the flag on the next microtask.
        queueMicrotask(() => {
            isInitialBatch = false;
            setReady(true);
        });

        // Cleanup
        return () => {
            off(eventsRef, "child_added", wrappedCallback);
        };
    }, [lobbyId]);

    function send(event: LobbyEvent) {
        if (!lobbyId) return;

        const eventsRef = ref(db, `lobbies/${lobbyId}/events`);
        const clean = JSON.parse(JSON.stringify(event));
        push(eventsRef, clean);
    }

    return { send, ready };
}