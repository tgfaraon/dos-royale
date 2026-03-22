import { useSingleplayerStore } from "../../stores/singleplayerGameStore";

export function CpuThinkingIndicator() {
    const gameState = useSingleplayerStore(s => s.state);
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