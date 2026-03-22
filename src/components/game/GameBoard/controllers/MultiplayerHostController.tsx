import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMultiplayerStore } from "../../../../stores/multiplayerGameStore";
import { useThemeStore } from "../../../../stores/themeStore";
import { audioManager } from "../../../../lib/audioManager";
import { useUserStore } from "../../../../stores/userStore";
import { useLobbyChannel, type LobbyEvent } from "../../../../hooks/useLobbyChannel";
import { getSeating } from "../../../../game-engine/seatMapping";
import { GameBoardView } from "../GameBoardView";
import type { Screen } from "../../../../types/Screen";
import type { Card as CardType } from "../../../../game-engine/types";
import { ref, set } from "firebase/database";
import { db, authReady } from "../../../../lib/firebase";
import { updateLeaderboard } from "../../../../stores/leaderboardStore";

interface MultiplayerHostControllerProps {
    mode: "private" | "public";
    onNavigate: (screen: Screen) => void;
    setScreen: (screen: Screen) => void;
}

export function MultiplayerHostController({
    setScreen,
}: MultiplayerHostControllerProps) {
    const gameState = useMultiplayerStore(s => s.state);

    const {
        hands,
        players,
        currentPlayerIndex,
        phase,
        lobbyId,
        turnTimer,
        lastCombo,
    } = gameState;

    const winner = useMultiplayerStore(s => s.state.winner)

    const userId = useUserStore(s => s.userId);

    const hostPlayCards = useMultiplayerStore(s => s.hostPlayCards);
    const hostPassTurn = useMultiplayerStore(s => s.hostPassTurn);
    const hostCpuTakeTurn = useMultiplayerStore(s => s.hostCpuTakeTurn);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [menuOpen, setMenuOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const theme = useThemeStore(s => s.theme);
    const setTheme = useThemeStore(s => s.setTheme);
    const themeVars = useThemeStore(s => s.themes[s.theme]).vars;
    const isHomeGame = theme === "homegame";

    const sendRef = useRef<(event: LobbyEvent) => void>(() => { });
    const isActiveRef = useRef(true);

    const readyRef = useRef(false);

    const sendGameEvent = useCallback((e: LobbyEvent) => {
        sendRef.current?.(e);
    }, []);

    const onGameEvent = useCallback(
        (event: LobbyEvent) => {
            if (!isActiveRef.current) return;

            switch (event.type) {
                case "game-init-lite": {
                    const { players, cpuCount, cpuDifficulty, seed } = event.payload;

                    const updated = useMultiplayerStore
                        .getState()
                        .hostInitializeGame(cpuCount, cpuDifficulty, players, seed);

                    sendGameEvent({ type: "game-init", state: updated });
                    break;
                }

                case "play-request": {
                    const engineIndex = players.findIndex(p => p.id === event.playerId);
                    if (engineIndex < 0) break;

                    const hand = useMultiplayerStore.getState().state.hands[engineIndex];
                    const cards = hand.filter(c => event.cardIds.includes(c.id));

                    const updated = hostPlayCards(engineIndex, cards);
                    sendGameEvent({ type: "turn-update", state: updated });
                    break;
                }

                case "pass-request": {
                    const engineIndex = players.findIndex(
                        p => p.id === event.playerId
                    );
                    if (engineIndex < 0) break;

                    const updated = hostPassTurn(engineIndex);
                    sendGameEvent({ type: "turn-update", state: updated });
                    break;
                }
            }
        },
        [players, hostPlayCards, hostPassTurn, sendGameEvent, setScreen]
    );

    const { send, ready } = useLobbyChannel(lobbyId, onGameEvent);

    useEffect(() => {
        sendRef.current = send;
    }, [send]);

    useEffect(() => {
        readyRef.current = ready;
    }, [ready]);

    useEffect(() => {
        return () => {
            isActiveRef.current = false;
        };
    }, []);

    const {
        rotatedPlayers,
        rotatedHands,
        activeSeatIndex,
        playerHand,
    } = useMemo(() => {
        return getSeating(players, hands, userId, currentPlayerIndex);
    }, [players, hands, userId, currentPlayerIndex]);

    const engineIndex = players.findIndex(p => p.id === userId);
    const isMyTurn = activeSeatIndex === 0 && playerHand.length > 0;

    const onToggleCard = (card: CardType) => {
        const next = new Set(selected);
        if (next.has(card.id)) next.delete(card.id);
        else next.add(card.id);
        setSelected(next);
    };

    const onPlay = useCallback(() => {
        if (engineIndex < 0 || !isMyTurn) return;

        const cardsToPlay = playerHand.filter(c => selected.has(c.id));
        if (!cardsToPlay.length) return;

        const updated = hostPlayCards(engineIndex, cardsToPlay);
        sendGameEvent({ type: "turn-update", state: updated });

        setSelected(new Set());
    }, [engineIndex, isMyTurn, playerHand, selected, hostPlayCards, sendGameEvent]);

    const onPass = useCallback(() => {
        if (engineIndex < 0 || !isMyTurn) return;

        const updated = hostPassTurn(engineIndex);
        sendGameEvent({ type: "turn-update", state: updated });

        setSelected(new Set());
    }, [engineIndex, isMyTurn, hostPassTurn, sendGameEvent]);

    useEffect(() => {
        const current = players[currentPlayerIndex];
        if (!current || !current.id.startsWith("cpu-")) return;

        const timeout = setTimeout(() => {
            const updated = hostCpuTakeTurn(currentPlayerIndex);
            sendGameEvent({ type: "turn-update", state: updated });
        }, 600);

        return () => clearTimeout(timeout);
    }, [currentPlayerIndex, players, hostCpuTakeTurn, sendGameEvent]);

    useEffect(() => {
        if (turnTimer == null) {
            queueMicrotask(() => setTimeLeft(null));
            return;
        }

        queueMicrotask(() => setTimeLeft(turnTimer));

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null) return null;
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentPlayerIndex, turnTimer]);

    useEffect(() => {
        if (timeLeft !== 0) return;
        if (engineIndex < 0) return;

        if (currentPlayerIndex === engineIndex) {
            queueMicrotask(() => onPass());
        }
    }, [timeLeft, currentPlayerIndex, engineIndex, onPass]);

    const onPlayAgain = () => {
        const store = useMultiplayerStore.getState();
        const lobbyId = store.state.lobbyId;

        // 1. Reset readiness
        useMultiplayerStore.setState(s => ({
            state: {
                ...s.state,
                players: s.state.players.map(p => ({
                    ...p,
                    ready: false,
                })),
            },
        }));

        // 2. Reset engine
        store.resetEngineState();

        // 3. Clear stale Firebase events
        if (lobbyId) {
            const eventsRef = ref(db, `lobbies/${lobbyId}/events`);
            set(eventsRef, null);
        }

        // 4. Navigate to lobby
        setScreen("private");
    };

    const onLeaveLobby = () => {
        if (!userId || !lobbyId) return;

        sendGameEvent({
            type: "player-leave",
            leavingPlayerId: userId,
        });

        setScreen("play");
    };

    useEffect(() => {
        return () => {
            setSelected(new Set());
        };
    }, []);

    useEffect(() => {
        audioManager.stopBgm();
    }, []);

    useEffect(() => {
        if (winner === null) return;

        (async () => {
            // Wait for Firebase Auth to be fully ready
            await authReady;

            const finalState = useMultiplayerStore.getState().state;

            console.log("[HOST] winner detected", {
                winner,
                players: finalState.players.map(p => p.id),
            });

            sendGameEvent({
                type: "game-over",
                state: finalState,
            });

            const winnerIndex = finalState.winner;
            const winnerId =
                winnerIndex !== null ? finalState.players[winnerIndex].id : null;

            console.log("[HOST] updating leaderboard", { winnerIndex, winnerId });
            console.log("[HOST] finalState.players", finalState.players);
            console.log(
                "[HOST] raw player IDs",
                finalState.players.map((p: { id: string }) => p.id)
            );

            updateLeaderboard(winnerId ?? "", finalState.players);
        })();
    }, [winner, sendGameEvent]);

    return (
        <GameBoardView
            players={players}
            rotatedPlayers={rotatedPlayers}
            rotatedHands={rotatedHands}
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
            onLeaveLobby={onLeaveLobby}
            setMenuOpen={setMenuOpen}
            setTheme={setTheme}
            seatingMode="rotated"
            lastCombo={lastCombo}
        />
    );
}