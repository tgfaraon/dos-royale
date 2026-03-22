import { useUserStore } from "../../../stores/userStore";
import { useMultiplayerStore } from "../../../stores/multiplayerGameStore";

import { SingleplayerController } from "./controllers/SingleplayerController";
import { MultiplayerHostController } from "./controllers/MultiplayerHostController";
import { MultiplayerGuestController } from "./controllers/MultiplayerGuestController";

import type { Screen } from "../../../types/Screen";

interface GameBoardProps {
    mode: "single" | "private" | "public" | null;
    cpuCount: number;
    cpuDifficulty: "easy" | "normal" | "hard";
    onNavigate: (screen: Screen) => void;
    setScreen: (screen: Screen) => void;
}

export function GameBoard(props: GameBoardProps) {
    const userId = useUserStore(s => s.userId);

    // Multiplayer hostId now comes from multiplayer store
    const hostId = useMultiplayerStore(s => s.state.hostId);

    const isMultiplayer = props.mode === "private" || props.mode === "public";
    const isHost = isMultiplayer && userId === hostId;

    // --- SINGLEPLAYER ---
    if (props.mode === "single") {
        return (
            <SingleplayerController
                {...props}
                mode="single"
            />
        );
    }

    // --- MULTIPLAYER HOST ---
    if (isMultiplayer && isHost) {
        return (
            <MultiplayerHostController
                {...props}
                mode={props.mode as "private" | "public"}
            />
        );
    }

    // --- MULTIPLAYER GUEST ---
    if (isMultiplayer && !isHost) {
        return (
            <MultiplayerGuestController
                {...props}
                mode={props.mode as "private" | "public"}
            />
        );
    }

    return <div className="p-8 text-black">Invalid game mode.</div>;
}