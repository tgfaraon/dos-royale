import { useEffect, useState } from "react";
import { useSingleplayerStore } from "../../../../stores/singleplayerGameStore";
import { useThemeStore } from "../../../../stores/themeStore";
import { audioManager } from "../../../../lib/audioManager";
import { GameBoardView } from "../GameBoardView";
import type { Screen } from "../../../../types/Screen";
import type { Card as CardType } from "../../../../game-engine/types";

interface SingleplayerControllerProps {
    mode: "single";
    cpuCount: number;
    cpuDifficulty: "easy" | "normal" | "hard";
    onNavigate: (screen: Screen) => void;
    setScreen: (screen: Screen) => void;
}

export function SingleplayerController({
    cpuCount,
    cpuDifficulty,
    setScreen,
}: SingleplayerControllerProps) {

    // NEW STORE SHAPE
    const gameState = useSingleplayerStore(s => s.state);

    const {
        hands,
        players,
        currentPlayerIndex,
        winner,
        phase,
        lastCombo,
    } = gameState;

    // UPDATED ACTIONS
    const startGame = useSingleplayerStore(s => s.startGame);
    const playCards = useSingleplayerStore(s => s.playCards);
    const passTurn = useSingleplayerStore(s => s.passTurn);
    const cpuTurn = useSingleplayerStore(s => s.cpuTurn);
    const clearSelection = useSingleplayerStore(s => s.clearSelection);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [menuOpen, setMenuOpen] = useState(false);
    const [timeLeft] = useState<number | null>(null);

    const theme = useThemeStore(s => s.theme);
    const setTheme = useThemeStore(s => s.setTheme);
    const themeVars = useThemeStore(s => s.themes[s.theme]).vars;
    const isHomeGame = theme === "homegame";

    // Correct human seat detection
    const humanSeat = players.findIndex(p => !p.id.startsWith("cpu-"));

    const activeSeatIndex = currentPlayerIndex;
    const playerHand = hands[humanSeat] ?? [];
    const isMyTurn = activeSeatIndex === humanSeat && playerHand.length > 0;

    const onToggleCard = (card: CardType) => {
        const next = new Set(selected);

        if (next.has(card.id)) {
            next.delete(card.id);
        } else {
            next.add(card.id);
        }

        setSelected(next);
    };

    const onPlay = () => {
        if (!isMyTurn) return;
        const cardsToPlay = playerHand.filter(c => selected.has(c.id));
        if (!cardsToPlay.length) return;
        playCards(cardsToPlay);
        setSelected(new Set());
    };

    const onPass = () => {
        if (!isMyTurn) return;
        passTurn();
        setSelected(new Set());
    };

    // CPU auto-turn
    useEffect(() => {
        const current = players[currentPlayerIndex];
        if (!current || !current.id.startsWith("cpu-")) return;

        const timeout = setTimeout(() => {
            cpuTurn();
        }, 600);

        return () => clearTimeout(timeout);
    }, [currentPlayerIndex, players, cpuTurn]);

    const onPlayAgain = () => {
        const safeCpuCount = Math.max(1, cpuCount || 0);
        startGame(safeCpuCount, cpuDifficulty);
    };

    useEffect(() => {
        if (!hands || hands.length === 0) {
            setScreen("play");
        }
    }, [hands, setScreen]);

    useEffect(() => clearSelection(), [clearSelection]);

    useEffect(() => {
        audioManager.stopBgm();
    }, []);

    return (
        <GameBoardView
            players={players}
            rotatedPlayers={players}
            rotatedHands={hands}
            playerHand={playerHand}
            activeSeatIndex={activeSeatIndex}
            selected={selected}
            isMyTurn={isMyTurn}
            timeLeft={timeLeft}
            winner={winner}
            gamePhase={phase}
            theme={theme}
            themeVars={themeVars}
            isHomeGame={isHomeGame}
            menuOpen={menuOpen}
            onToggleCard={onToggleCard}
            onPlay={onPlay}
            onPass={onPass}
            onPlayAgain={onPlayAgain}
            onLeaveLobby={() => setScreen("play")}
            setMenuOpen={setMenuOpen}
            setTheme={setTheme}
            seatingMode="fixed"
            lastCombo={lastCombo}
        />
    );
}