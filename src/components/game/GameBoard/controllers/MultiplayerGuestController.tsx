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
import { db } from "../../../../lib/firebase";

interface MultiplayerGuestControllerProps {
    mode: "private" | "public";
    onNavigate: (screen: Screen) => void;
    setScreen: (screen: Screen) => void;
}

export function MultiplayerGuestController({
    setScreen,
}: MultiplayerGuestControllerProps) {
    const gameState = useMultiplayerStore(s => s.state);

    const {
        hands,
        players,
        currentPlayerIndex,
        winner,
        phase,
        lobbyId,
        turnTimer,
        lastCombo,
    } = gameState;

    const userId = useUserStore(s => s.userId);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [menuOpen, setMenuOpen] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const theme = useThemeStore(s => s.theme);
    const setTheme = useThemeStore(s => s.setTheme);
    const themeVars = useThemeStore(s => s.themes[s.theme]).vars;
    const isHomeGame = theme === "homegame";

    const sendRef = useRef<((e: LobbyEvent) => void) | null>(null);
    const isActiveRef = useRef(true);

    const sendGameEvent = useCallback((e: LobbyEvent) => {
        sendRef.current?.(e);
    }, []);

    const onGameEvent = useCallback((event: LobbyEvent) => {
        if (!isActiveRef.current) return;

        switch (event.type) {
            case "game-init-lite": {
                console.log("[GUEST] GAME_INIT_LITE", event.payload);
                break;
            }

            case "game-init": {
                useMultiplayerStore.setState({
                    state: event.state,
                });
                break;
            }

            case "turn-update":
            case "round-end":
            case "game-over": {
                useMultiplayerStore.setState({
                    state: event.state,
                });
                break;
            }


        }
    }, [setScreen]);

    const { send, ready } = useLobbyChannel(lobbyId, onGameEvent);

    useEffect(() => {
        if (!ready) return;
        console.log("[GUEST] Channel ready");
    }, [ready]);

    useEffect(() => {
        sendRef.current = send;
    }, [send]);

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

    const onPlay = () => {
        if (engineIndex < 0 || !isMyTurn) return;

        const cardsToPlay = playerHand.filter(c => selected.has(c.id));
        if (!cardsToPlay.length) return;

        sendGameEvent({
            type: "play-request",
            playerId: userId!,
            cardIds: cardsToPlay.map(c => c.id),
        });

        setSelected(new Set());
    };

    const onPass = () => {
        if (engineIndex < 0 || !isMyTurn) return;

        sendGameEvent({
            type: "pass-request",
            playerId: userId!,
        });

        setSelected(new Set());
    };

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
        if (!userId) return;

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