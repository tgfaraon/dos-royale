import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useGameStore } from "../../stores/gameStore";
import { PlayerHand } from "../players/PlayerHand";
import { CpuHand } from "../players/CpuHand";
import { TableArea } from "../game/TableArea";
import { ActionBar } from "../game/ActionBar";
import type { Card as CardType } from "../../game-engine/types";
import { GameOverModal } from "../ui/GameOverModal";
import { useThemeStore } from "../../stores/themeStore";
import type { ThemeName } from "../../stores/themeStore";
import type { Screen } from "../../types/Screen";
import { useAudioStore } from "../../stores/audioStore";
import { audioManager } from "../../lib/audioManager";
import { useUserStore } from "../../stores/userStore";
import { useLobbyChannel, type LobbyEvent } from "../../hooks/useLobbyChannel";
import { getSeating } from "../../game-engine/seatMapping";
import type { PlayerInfo } from "../../stores/gameStore";
import { ref, set } from "firebase/database";
import { db } from "../../lib/firebase";

interface GameBoardProps {
    mode: "single" | "private" | "public" | null;
    cpuCount: number;
    cpuDifficulty: "easy" | "normal" | "hard";
    onNavigate: (screen: Screen) => void;
    setScreen: (screen: Screen) => void;
}

function TimerBubble({ timeLeft }: { timeLeft: number | null }) {
    if (timeLeft === null) return null;

    return (
        <div className="px-2 py-1 text-xs font-semibold text-white rounded-full shadow-md bg-black/60">
            {timeLeft}s
        </div>
    );
}

function OpponentHand({
    username,
    cardCount,
    isActive,
    position,
}: {
    username: string;
    cardCount: number;
    isActive: boolean;
    position: "top" | "left" | "right";
}) {
    return (
        <div className="flex flex-col items-center text-white">
            <div className={`text-sm mb-1 ${isActive ? "font-bold text-yellow-300" : ""}`}>
                {username}
            </div>
            <CpuHand position={position} count={cardCount} isActive={isActive} />
        </div>
    );
}

export function GameBoard({
    cpuCount,
    cpuDifficulty,
    onNavigate,
    setScreen,
}: GameBoardProps) {
    const gameState = useGameStore(s => s.gameState);

    const {
        hands = [],
        currentPlayerIndex,
        lastCombo,
        turnTimer,
        winner,
        players = [],
        hostId,
        lobbyId,
    } = gameState;

    const userId = useUserStore(s => s.userId);
    const isHost = userId === hostId;

    const singleInitializeGame = useGameStore(s => s.singleInitializeGame);
    const clearSelection = useGameStore(s => s.clearSelection);

    const hostPlayCards = useGameStore(s => s.hostPlayCards);
    const hostPassTurn = useGameStore(s => s.hostPassTurn);
    const hostCpuTakeTurn = useGameStore(s => s.hostCpuTakeTurn);

    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [menuOpen, setMenuOpen] = useState(false);

    const theme = useThemeStore(state => state.theme);
    const setTheme = useThemeStore(state => state.setTheme);
    const themeVars = useThemeStore(state => state.themes[state.theme]).vars;
    const isHomeGame = theme === "homegame";

    const {
        volume,
        setVolume,
        muted,
        toggleMute,
        bgmVolume,
        setBgmVolume,
        bgmEnabled,
        toggleBgm,
    } = useAudioStore();

    const isResettingRef = useRef(false);

    const isMultiplayer = Boolean(lobbyId && players.length > 1);

    const resetEngineState = useGameStore(s => s.resetEngineState);


    const handlePlayAgain = () => {
        if (isMultiplayer) {
            isResettingRef.current = true;

            // Host clears old events so the lobby doesn't replay them
            if (isHost && lobbyId) {
                const eventsRef = ref(db, `lobbies/${lobbyId}/events`);
                set(eventsRef, null);
            }

            resetEngineState();
            setScreen("privateLobby");

            setTimeout(() => {
                isResettingRef.current = false;
            }, 200);
        } else {
            singleInitializeGame(cpuCount, cpuDifficulty);
        }
    };

    const handleLeaveLobby = () => {
        if (!userId) return;
        sendGameEvent({
            type: "player-leave",
            leavingPlayerId: userId
        });
        setScreen("play");
    };

    const {
        localPlayerIndex,
        rotatedPlayers,
        rotatedHands,
        activeSeatIndex,
        playerHand
    } = useMemo(() => {
        return getSeating(players, hands, userId, currentPlayerIndex);
    }, [players, hands, userId, currentPlayerIndex]);

    const engineIndex = players.findIndex(p => p.id === userId);
    const isMyTurn = activeSeatIndex === 0 && playerHand.length > 0;

    useEffect(() => {
        console.log("[SEAT DEBUG]", {
            userId,
            players: players.map(p => p.id),
            localPlayerIndex,
            engineIndex,
            currentPlayerIndex,
            activeSeatIndex,
            isMyTurn,
            rotatedPlayers: rotatedPlayers.map((p: PlayerInfo) => p.username),
        });
    }, [
        userId,
        players,
        localPlayerIndex,
        currentPlayerIndex,
        activeSeatIndex,
        isMyTurn,
        rotatedPlayers,
        engineIndex
    ]);

    // --- Multiplayer sync handler ---

    const sendRef = useRef<((e: LobbyEvent) => void) | null>(null);
    const isActiveRef = useRef(true);

    const sendGameEvent = useCallback((e: LobbyEvent) => {
        sendRef.current?.(e);
    }, []);

    const onGameEvent = useCallback(
        (event: LobbyEvent) => {
            if (isResettingRef.current) return;
            if (!isActiveRef.current) return;

            if (
                event.type === "turn-update" ||
                event.type === "round-end" ||
                event.type === "game-over"
            ) {
                console.log("[TURN EVENT]", {
                    side: isHost ? "HOST" : "GUEST",
                    type: event.type,
                    currentPlayerIndex: event.state.currentPlayerIndex,
                    handSizes: event.state.hands.map(h => h.length),
                    players: event.state.players.map(p => p.id),
                });
            }

            switch (event.type) {
                case "turn-update":
                case "round-end":
                case "game-over": {
                    // Always fully replace gameState with the authoritative state
                    useGameStore.setState({
                        gameState: event.state,
                    });
                    break;
                }

                case "play-request": {
                    if (!isHost) break;

                    const state = useGameStore.getState().gameState;

                    const idx = state.players.findIndex(
                        p => p.id === event.playerId
                    );
                    if (idx < 0) break;

                    // Host applies the play in the engine
                    const updated = hostPlayCards(idx, event.cards);

                    // Host broadcasts the full updated state
                    sendGameEvent({
                        type: "turn-update",
                        state: updated,
                    });

                    break;
                }

                case "pass-request": {
                    if (!isHost) break;

                    const state = useGameStore.getState().gameState;

                    const idx = state.players.findIndex(
                        p => p.id === event.playerId
                    );
                    if (idx < 0) break;

                    const updated = hostPassTurn(idx);

                    sendGameEvent({
                        type: "turn-update",
                        state: updated,
                    });

                    break;
                }
            }
        },
        [isHost, sendGameEvent, hostPlayCards, hostPassTurn, userId, hostId]
    );

    const { send, unsubscribe } = useLobbyChannel(lobbyId, onGameEvent);

    useEffect(() => {
        return () => {
            unsubscribe?.();        // ⬅️ THIS IS THE FIX
            isActiveRef.current = false;
        };
    }, []);

    useEffect(() => {
        sendRef.current = send;
    }, [send]);

    // --- Play handler ---

    const handlePlay = () => {
        if (engineIndex < 0) return;

        const cardsToPlay = playerHand.filter((c: CardType) => selected.has(c.id));
        if (!cardsToPlay.length) return;

        if (isMultiplayer) {
            if (isHost) {
                const updated = hostPlayCards(engineIndex, cardsToPlay);

                sendGameEvent({
                    type: "turn-update",
                    state: updated,
                });
            } else if (userId) {
                sendGameEvent({
                    type: "play-request",
                    playerId: userId,
                    cards: cardsToPlay,
                });
            }
        } else {
            hostPlayCards(engineIndex, cardsToPlay);
        }

        setSelected(new Set());
    };

    // --- Pass handler ---

    const handlePass = useCallback(() => {
        if (engineIndex < 0) return;

        if (isMultiplayer) {
            if (isHost) {
                const updated = hostPassTurn(engineIndex);

                sendGameEvent({
                    type: "turn-update",
                    state: updated,
                });
            } else if (userId) {
                sendGameEvent({
                    type: "pass-request",
                    playerId: userId,
                });
            }
        } else {
            hostPassTurn(engineIndex);
        }

        setSelected(new Set());
    }, [engineIndex, isMultiplayer, isHost, hostPassTurn, sendGameEvent, userId]);

    // --- Timer setup ---

    useEffect(() => {
        if (!isMultiplayer || turnTimer == null) {
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
    }, [currentPlayerIndex, turnTimer, isMultiplayer]);

    // --- Auto-pass on timeout (multiplayer only) ---
    useEffect(() => {
        if (!isMultiplayer) return;
        if (!hostId) return; // wait for hydration
        if (timeLeft !== 0) return;
        if (engineIndex < 0) return;

        // Only the host should auto-pass for themselves
        if (currentPlayerIndex === engineIndex && isHost) {
            queueMicrotask(() => handlePass());
        }
    }, [
        timeLeft,
        isMultiplayer,
        currentPlayerIndex,
        handlePass,
        engineIndex,
        isHost,
        hostId
    ]);

    // --- Stop BGM on entering game ---

    useEffect(() => {
        audioManager.stopBgm();
    }, []);

    // --- CPU auto-turn (host only) ---
    useEffect(() => {
        if (isResettingRef.current) return;
        if (!isMultiplayer) return;
        if (!hostId) return;

        const current = players[currentPlayerIndex];
        if (!current || !current.id.startsWith("cpu-")) return;
        if (!isHost) return;

        const timeout = setTimeout(() => {
            const updated = hostCpuTakeTurn(currentPlayerIndex);
            sendGameEvent({ type: "turn-update", state: updated });
        }, 600);

        return () => clearTimeout(timeout);
    }, [
        currentPlayerIndex,
        players,
        isMultiplayer,
        isHost,
        hostId,
        hostCpuTakeTurn,
        sendGameEvent
    ]);

    // --- Return to menu if gameState wiped ---

    useEffect(() => {
        if (isMultiplayer) return;

        if (!hands || hands.length === 0) {
            if (!isResettingRef.current) {
                setScreen("play");
            }
        }
    }, [hands, isMultiplayer, setScreen]);

    const toggleCard = (card: CardType) => {
        const next = new Set(selected);
        if (next.has(card.id)) next.delete(card.id);
        else next.add(card.id);
        setSelected(next);
    };

    const safeWinner = typeof winner === "number" ? winner : null;

    useEffect(() => {
        return () => {
            // cleanup when leaving game
            clearSelection();
        };
    }, []);

    useEffect(() => {
        return () => {
            isActiveRef.current = false;
        };
    }, []);

    return (
        <div
            className=" 
                w-full h-screen
                flex flex-col items-center
                text-[var(--theme-text)]
                overflow-visible
                p-0 
                bg-transparent
            "
            style={{ background: themeVars["--background-gradient"] }}
        >
            {/* HAMBURGER BUTTON */}
            <button
                onClick={() => setMenuOpen(true)}
                className=" 
                    fixed top-4 right-4
                    w-10 h-10
                    flex flex-col justify-center items-center
                    gap-[5px]
                    p-2 rounded-md
                    bg-[var(--theme-surface)]
                    border border-[var(--theme-accent)]
                    shadow-[0_0_8px_rgba(0,0,0,0.5)]
                    backdrop-blur-sm
                    transition-all
                    hover:brightness-110
                    z-[999999]
                    pointer-events-auto
                "
            >
                <span className="block w-6 h-[3px] bg-[var(--theme-accent)] rounded" />
                <span className="block w-6 h-[3px] bg-[var(--theme-accent)] rounded" />
                <span className="block w-6 h-[3px] bg-[var(--theme-accent)] rounded" />
            </button>

            {/* BACKDROP */}
            {menuOpen && (
                <div
                    onClick={() => setMenuOpen(false)}
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                />
            )}

            {/* MENU PANEL */}
            {menuOpen && (
                <div
                    className=" 
                        fixed top-4 right-4 z-[9998]
                        w-56 p-4
                        rounded-lg
                        bg-[var(--theme-surface)]
                        border border-[var(--theme-accent)]
                        shadow-[0_0_20px_rgba(0,0,0,0.6)]
                        animate-fadeIn
                    "
                >
                    <h3 className="mb-3 text-lg font-bold text-[var(--theme-accent)]">
                        Settings
                    </h3>

                    {/* Theme Selector */}
                    <label className="block mb-1 text-sm opacity-80">Theme</label>
                    <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as ThemeName)}
                        className=" 
                            w-full mb-4 px-2 py-1 rounded
                            bg-black/40 text-[var(--theme-text)]
                            border border-[var(--theme-accent)]
                        "
                    >
                        <option value="vegas">Modern Vegas</option>
                        <option value="atlantic">Atlantic City</option>
                        <option value="highroller">High Roller</option>
                        <option value="homegame">Home Game</option>
                    </select>

                    <h3 className="text-md font-semibold text-[var(--theme-text)]">
                        CPU Difficulty
                    </h3>

                    <p className="mb-2 text-sm opacity-80">
                        {cpuDifficulty.charAt(0).toUpperCase() + cpuDifficulty.slice(1)}
                    </p>

                    <p className="text-xs text-[var(--theme-text)] opacity-60 leading-tight">
                        Difficulty can only be changed before starting a new game.
                    </p>


                    <p className="text-xs text-[var(--theme-text)] opacity-60 leading-tight">
                        Difficulty changes apply when starting a new game.
                    </p>

                    <div className="mt-4 space-y-4">
                        {/* BGM SETTINGS */}
                        <div>
                            <h3 className="mb-1 text-sm opacity-80">Background Music</h3>

                            <button
                                onClick={toggleBgm}
                                className=" 
                                    w-full px-3 py-2 rounded
                                    bg-[var(--theme-surface)] text-[var(--theme-text)]
                                    border border-[var(--theme-accent)] opacity-80
                                    hover:opacity-100 transition-all mb-2
                                "
                            >
                                {bgmEnabled ? "Disable BGM" : "Enable BGM"}
                            </button>

                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={bgmVolume}
                                onChange={(e) => setBgmVolume(Number(e.target.value))}
                                className="w-full accent-[var(--theme-accent)]"
                            />
                        </div>

                        {/* SFX SETTINGS */}
                        <div>
                            <h3 className="mb-1 text-sm opacity-80">Sound Effects</h3>

                            <button
                                onClick={toggleMute}
                                className=" 
                                    w-full px-3 py-2 rounded
                                    bg-[var(--theme-surface)] text-[var(--theme-text)]
                                    border border-[var(--theme-accent)] opacity-80
                                    hover:opacity-100 transition-all mb-2
                                "
                            >
                                {muted ? "Unmute SFX" : "Mute SFX"}
                            </button>

                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.01}
                                value={volume}
                                onChange={(e) => setVolume(Number(e.target.value))}
                                className="w-full accent-[var(--theme-accent)]"
                            />
                        </div>
                    </div>

                    {/* Start New Game */}
                    <button
                        onClick={() => {
                            useGameStore.getState().hostInitializeGame(cpuCount, cpuDifficulty);
                        }}
                        className=" 
                            w-full mb-3 px-3 py-2 rounded
                            bg-[var(--theme-accent)] text-black font-semibold
                            hover:brightness-110 transition-all
                        "
                    >
                        Start New Game
                    </button>

                    {/* Exit to Main Menu */}
                    <button
                        onClick={() => onNavigate("menu")}
                        className=" 
                            w-full px-3 py-2 rounded
                            bg-black/40 text-[var(--theme-text)]
                            border border-[var(--theme-accent)]
                            hover:brightness-110 transition-all
                        "
                    >
                        Exit to Main Menu
                    </button>
                </div>
            )}

            {/* TABLE RIM WRAPPER */}
            <div
                className="
                    relative 
                    mx-auto w-full 
                    max-w-[480px] aspect-[1/2] 
                    rounded-full 
                    p-2
                    shadow-[0_8px_20px_rgba(0,0,0,0.6)]
                    bg-[var(--table-rim)]
                    border-[3px] border-[var(--table-rim-highlight)]
                "
                style={{
                    padding: `var(--rim-thickness)`,
                    borderRadius: `var(--rim-radius)`,
                    background: "var(--rim-material)",
                    backgroundImage: themeVars["--rim-texture"],
                    boxShadow: `
                        0 12px 28px rgba(0,0,0,0.55),
                        inset 0 0 12px ${themeVars["--rim-highlight"]},
                        inset 0 0 24px ${themeVars["--rim-shadow"]}
                    `,
                    border: `3px solid ${themeVars["--table-rim-highlight"]}`,
                }}
            >
                {/* INNER BEVEL */}
                <div
                    className="p-2 rounded-full shadow-inner"
                    style={{
                        boxShadow: "inset 0 0 28px rgba(0,0,0,0.55)",
                    }}
                >

                    {/* TABLE */}
                    <div
                        className=" 
                            relative
                            w-full
                            max-w-[480px]
                            aspect-[1/2]
                            mt-6
                            overflow-visible
                            rounded-[999px]
                            flex flex-col justify-between items-center
                        "
                        style={{
                            border: `
                                0 0 40px ${isHomeGame ? themeVars["--wood-shadow"] : themeVars["--felt-shadow"]},
                                inset 0 0 20px rgba(0,0,0,0.35)
                            `,
                            background: isHomeGame
                                ? themeVars["--wood-base"]
                                : themeVars["--felt-color"],
                            boxShadow: `0 0 40px 
                                ${isHomeGame
                                    ? themeVars["--wood-shadow"]
                                    : themeVars["--felt-shadow"]
                                }`,
                        }}
                    >
                        {/* Top light */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background:
                                    "linear-gradient(to bottom, rgba(255,255,255,0.10) 0%, transparent 45%)",
                                mixBlendMode: "overlay",
                            }}
                        />

                        {/* Felt texture (grain) */}
                        {!isHomeGame && (
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: ` 
                                    radial-gradient(circle at 20% 20%, rgba(255,255,255,0.04) 0%, transparent 60%),
                                    radial-gradient(circle at 80% 30%, rgba(255,255,255,0.03) 0%, transparent 70%),
                                    radial-gradient(circle at 50% 80%, rgba(255,255,255,0.05) 0%, transparent 65%),
                                    repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 4px)
                                `,
                                    opacity: 0.55,
                                    mixBlendMode: "overlay",
                                }}
                            />
                        )}

                        {/* FELT REALISM LAYERS */}
                        {!isHomeGame && (
                            <>
                                {/* Wear Ring (subtle darker oval where cards land) */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: ` 
                                            radial-gradient(
                                                ellipse at center,
                                                rgba(0,0,0,0.18) 0%,
                                                rgba(0,0,0,0.10) 35%,
                                                rgba(0,0,0,0.00) 70%
                                            )
                                        `,
                                        opacity: 0.35,
                                        mixBlendMode: "multiply",
                                    }}
                                />

                                {/* Directional Felt Grain */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: ` 
                                            repeating-linear-gradient(
                                                135deg,
                                                rgba(255,255,255,0.015) 0px,
                                                rgba(255,255,255,0.015) 2px,
                                                transparent 2px,
                                                transparent 6px
                                            )
                                        `,
                                        opacity: 0.4,
                                        mixBlendMode: "overlay",
                                    }}
                                />

                                {/* Micro Noise Layer */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: ` 
                                            repeating-linear-gradient(
                                                0deg,
                                                rgba(255,255,255,0.02) 0px,
                                                rgba(255,255,255,0.02) 1px,
                                                transparent 1px,
                                                transparent 3px
                                            )
                                        `,
                                        opacity: 0.25,
                                        mixBlendMode: "soft-light",
                                    }}
                                />

                                {/* Center Glow (table light) */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: ` 
                                            radial-gradient(
                                                circle at 50% 35%,
                                                rgba(255,255,255,0.10) 0%,
                                                rgba(255,255,255,0.05) 25%,
                                                rgba(255,255,255,0.00) 70%
                                            )
                                        `,
                                        mixBlendMode: "overlay",
                                    }}
                                />
                            </>
                        )}

                        {/* Vignette */}
                        <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                boxShadow: "inset 0 0 45px rgba(0,0,0,0.40)",
                                borderRadius: "inherit",
                            }}
                        />

                        {/* Center watermark */}
                        {!isHomeGame && (
                            <div
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                style={{
                                    opacity: 0.65,
                                    mixBlendMode: "overlay",
                                    fontSize: "2.0rem",
                                    fontWeight: 800,
                                    letterSpacing: "0.1em",
                                    color: "var(--theme-accent)",
                                    textShadow: "0 0 12px rgba(0,0,0,0.35)",
                                    transform: "translateY(-6%)",
                                }}
                            >
                                DOS ♦ ROYALE
                            </div>
                        )}

                        {/* center cards */}
                        <div className="absolute inset-0 flex items-center justify-center scale-[1.25]">
                            <TableArea lastCombo={lastCombo} />
                        </div>

                        {/* TOP SEAT */}
                        {rotatedPlayers[2] && (
                            <>
                                {isMultiplayer && activeSeatIndex === 2 && (
                                    <div className="absolute right-4 -top-2">
                                        <TimerBubble timeLeft={timeLeft} />
                                    </div>
                                )}

                                <div className="absolute left-1/2" style={{ top: "6%", transform: "translateX(-50%) rotate(2deg)" }}>
                                    {rotatedPlayers[2].id.startsWith("cpu-") ? (
                                        <CpuHand
                                            position="top"
                                            count={rotatedHands[2]?.length ?? 0}
                                            isActive={activeSeatIndex === 2}
                                        />
                                    ) : (
                                        <OpponentHand
                                            username={rotatedPlayers[2].username}
                                            cardCount={rotatedHands[2]?.length ?? 0}
                                            isActive={activeSeatIndex === 2}
                                            position="top"
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        {/* LEFT SEAT */}
                        {rotatedPlayers[3] && (
                            <>
                                {isMultiplayer && activeSeatIndex === 3 && (
                                    <div className="absolute top-0 -translate-x-1/2 -translate-y-full left-1/2">
                                        <TimerBubble timeLeft={timeLeft} />
                                    </div>
                                )}

                                <div className="absolute" style={{ left: "4%", top: "28%", transform: "rotate(-8deg)" }}>
                                    {rotatedPlayers[3].id.startsWith("cpu-") ? (
                                        <CpuHand
                                            position="left"
                                            count={rotatedHands[3]?.length ?? 0}
                                            isActive={activeSeatIndex === 3}
                                        />
                                    ) : (
                                        <OpponentHand
                                            username={rotatedPlayers[3].username}
                                            cardCount={rotatedHands[3]?.length ?? 0}
                                            isActive={activeSeatIndex === 3}
                                            position="left"
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        {/* RIGHT SEAT */}
                        {rotatedPlayers[1] && (
                            <>
                                {isMultiplayer && activeSeatIndex === 1 && (
                                    <div className="absolute top-0 -translate-x-1/2 -translate-y-full left-1/2">
                                        <TimerBubble timeLeft={timeLeft} />
                                    </div>
                                )}

                                <div className="absolute" style={{ right: "4%", top: "28%", transform: "rotate(8deg)" }}>
                                    {rotatedPlayers[1].id.startsWith("cpu-") ? (
                                        <CpuHand
                                            position="right"
                                            count={rotatedHands[1]?.length ?? 0}
                                            isActive={activeSeatIndex === 1}
                                        />
                                    ) : (
                                        <OpponentHand
                                            username={rotatedPlayers[1].username}
                                            cardCount={rotatedHands[1]?.length ?? 0}
                                            isActive={activeSeatIndex === 1}
                                            position="right"
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        {/* PLAYER (BOTTOM) */}
                        <div className="absolute flex flex-col items-center gap-3 -translate-x-1/2 bottom-2 left-1/2 z-[999]">
                            {isMultiplayer && activeSeatIndex === 0 && (
                                <div className="absolute right-4 bottom-32">
                                    <TimerBubble timeLeft={timeLeft} />
                                </div>
                            )}

                            <PlayerHand
                                hand={playerHand}
                                selected={selected}
                                toggleCard={toggleCard}
                                isActive={activeSeatIndex === 0}
                            />

                            <ActionBar
                                onPlay={handlePlay}
                                onPass={handlePass}
                                disabled={!isMyTurn}
                            />
                        </div>

                        {/* WINNER */}
                        {gameState.phase === "gameover" && winner !== null && (
                            <div
                                className=" 
                                    absolute
                                    top-1/2 left-1/2
                                    -translate-x-1/2 -translate-y-[200%]
                                    text-3xl font-extrabold
                                    text-yellow-300
                                    drop-shadow-[0_0_12px_rgba(255,215,0,0.6)]
                                "
                            >
                                Player {winner} wins!
                            </div>
                        )}

                        <GameOverModal
                            winner={safeWinner}
                            onPlayAgain={handlePlayAgain}
                            onLeaveLobby={isMultiplayer ? handleLeaveLobby : undefined}
                            isMultiplayer={isMultiplayer}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}