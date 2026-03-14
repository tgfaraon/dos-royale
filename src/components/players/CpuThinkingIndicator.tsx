import { useGameStore } from "../../stores/gameStore";

export function CpuThinkingIndicator() {
    const gameState = useGameStore(s => s.gameState);
    const { currentPlayerIndex, players } = gameState;

    const current = players[currentPlayerIndex];

    if (!current) return null;
    if (!current.id.startsWith("cpu-")) return null;

    return (
        <div className="text-xs italic text-yellow-300">
            CPU is thinking...
        </div>
    );
}
