import type { PlayerInfo } from "../stores/singleplayerGameStore";
import type { Card } from "./types"; // adjust path if needed

// Find where the local user sits in the engine array
export function getLocalPlayerIndex(
    players: PlayerInfo[],
    userId: string | null
): number {
    if (!players?.length || !userId) return -1;
    return players.findIndex(p => p.id === userId);
}

// Rotate an array so that localIndex becomes index 0
export function getRotated<T>(arr: T[], localIndex: number): T[] {
    if (!arr?.length || localIndex < 0) return arr ?? [];
    return [...arr.slice(localIndex), ...arr.slice(0, localIndex)];
}

// Map engine index → rotated UI seat index
export function getActiveSeatIndex(
    currentPlayerIndex: number,
    localPlayerIndex: number,
    totalPlayers: number
): number | null {
    if (currentPlayerIndex < 0 || localPlayerIndex < 0) return null;
    return (currentPlayerIndex - localPlayerIndex + totalPlayers) % totalPlayers;
}

// Main helper used by GameBoard
export function getSeating(
    players: PlayerInfo[],
    hands: Card[][],
    userId: string | null,
    currentPlayerIndex: number
) {
    // 1. Find the engine index of the local user
    const localPlayerIndex = getLocalPlayerIndex(players, userId);

    // 2. Rotate ONLY for UI display
    const uiPlayers = getRotated(players, localPlayerIndex);
    const uiHands = getRotated(hands, localPlayerIndex);

    // 3. Compute which UI seat is currently active
    const activeSeatIndex = getActiveSeatIndex(
        currentPlayerIndex,
        localPlayerIndex,
        players.length
    );

    return {
        // ENGINE INDEX — do NOT rotate
        localPlayerIndex,

        // UI ONLY — safe to rotate
        rotatedPlayers: uiPlayers,
        rotatedHands: uiHands,

        // UI seat index of the active player
        activeSeatIndex,

        // Local player's hand (always seat 0 in UI)
        playerHand: uiHands[0] ?? [],
    };
}