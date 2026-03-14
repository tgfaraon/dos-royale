import type { PlayerInfo } from "../stores/gameStore";
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
    const localPlayerIndex = getLocalPlayerIndex(players, userId);

    const rotatedPlayers = getRotated(players, localPlayerIndex);
    const rotatedHands = getRotated(hands, localPlayerIndex);

    const activeSeatIndex = getActiveSeatIndex(
        currentPlayerIndex,
        localPlayerIndex,
        players.length
    );

    return {
        localPlayerIndex,
        rotatedPlayers,
        rotatedHands,
        activeSeatIndex,
        playerHand: rotatedHands[0] ?? [],
    };
}