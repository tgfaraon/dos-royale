import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import {
    useMultiplayerStore,
    MAX_PLAYERS,
} from "../../stores/multiplayerGameStore";
import type { MultiplayerState } from "../../stores/multiplayerGameStore";
import { useUserStore } from "../../stores/userStore";
import { useThemeStore } from "../../stores/themeStore";
import type { ThemeName } from "../../stores/themeStore";
import { useLobbyChannel, type LobbyEvent } from "../../hooks/useLobbyChannel";
import { ref, set } from "firebase/database";
import { db } from "../../lib/firebase";
import type { Screen } from "../../types/Screen";
import type { PlayerInfo } from "../../stores/singleplayerGameStore";

interface PrivateMatchLobbyProps {
    onNavigate: (screen: Screen) => void;
}

export default function PrivateMatchLobby({ onNavigate }: PrivateMatchLobbyProps) {
    // ---------- Zustand state ----------
    const hostId = useMultiplayerStore(s => s.state.hostId);
    const players = useMultiplayerStore(s => s.state.players);
    const lobbyId = useMultiplayerStore(s => s.state.lobbyId);
    const cpuCount = useMultiplayerStore(s => s.state.cpuCount);
    const cpuDifficulty = useMultiplayerStore(s => s.state.cpuDifficulty);
    const turnTimer = useMultiplayerStore(s => s.state.turnTimer);

    const setPlayers = useMultiplayerStore(s => s.setPlayers);
    const setHostId = useMultiplayerStore(s => s.setHostId);
    const setLobbyId = useMultiplayerStore(s => s.setLobbyId);

    const hostInitializeGame = useMultiplayerStore(s => s.hostInitializeGame);

    const theme = useThemeStore(s => s.theme);
    const setTheme = useThemeStore(s => s.setTheme);

    // ---------- User ----------
    const userId = useUserStore(s => s.userId);
    const username = useUserStore(s => s.username);
    const avatarUrl = useUserStore(s => s.avatarUrl);

    const safeUsername = username ?? "";

    const user = useMemo(() => {
        if (!userId) return null;
        return { userId, username: safeUsername, avatarUrl };
    }, [userId, safeUsername, avatarUrl]);

    const hasJoinedRef = useRef(false);
    const shouldHostSyncRef = useRef(false);

    const isHost = hostId === userId;

    // ---------- Realtime channel ID ----------
    const channelId = lobbyId;

    // ---------- Host match start helper ref ----------
    const hostStartMatchRef = useRef<(players: PlayerInfo[]) => void>(() => { });

    // ---------- Lobby event handler (MUST come before useLobbyChannel) ----------
    const onLobbyEvent = useCallback(
        (event: LobbyEvent) => {
            console.log("[LOBBY EVENT]", event);

            // Ignore mid-game events in lobby
            if (
                event.type === "turn-update" ||
                event.type === "round-end"
            ) {
                return;
            }

            // Allow game-over so leaderboard can update
            if (event.type === "game-over") {
                if (!isHost) return; // only host updates leaderboard
            }

            // Lightweight init
            if (event.type === "game-init-lite") {
                const { players, cpuCount, cpuDifficulty, seed } = event.payload;

                useMultiplayerStore.setState(prev => ({
                    state: {
                        ...prev.state,
                        players,
                        cpuCount,
                        cpuDifficulty:
                            cpuDifficulty as MultiplayerState["cpuDifficulty"],
                    },
                }));

                useMultiplayerStore.getState().hostInitializeGame(
                    cpuCount,
                    cpuDifficulty as MultiplayerState["cpuDifficulty"],
                    players,
                    seed
                );

                onNavigate("game");
                return;
            }

            // Full init
            if (event.type === "game-init") {
                useMultiplayerStore.setState(() => ({
                    state: { ...event.state },
                }));

                onNavigate("game");
                return;
            }

            // All other lobby events
            useMultiplayerStore.setState(prev => {
                const gs = prev.state;

                // Prevent lobby overwriting game state
                if (window.location.pathname.includes("game")) {
                    if (
                        event.type !== "player-join" &&
                        event.type !== "player-leave" &&
                        event.type !== "player-ready" &&
                        event.type !== "lobby-sync"
                    ) {
                        return { state: gs };
                    }
                }

                switch (event.type) {
                    case "player-join": {
                        const exists = gs.players.some(p => p.id === event.player.id);

                        const nextPlayers = exists
                            ? [...gs.players]
                            : [...gs.players, { ...event.player }];

                        const nextHostId =
                            event.isHost && !gs.hostId
                                ? event.player.id
                                : gs.hostId ?? null;

                        if (isHost && !event.isHost) {
                            shouldHostSyncRef.current = true;
                        }

                        return {
                            state: {
                                ...gs,
                                players: nextPlayers,
                                hostId: nextHostId,
                            },
                        };
                    }

                    case "player-leave": {
                        const remaining = gs.players.filter(
                            p => p.id !== event.leavingPlayerId
                        );

                        const nextHost =
                            event.leavingPlayerId === gs.hostId
                                ? remaining[0]?.id ?? null
                                : gs.hostId;

                        return {
                            state: {
                                ...gs,
                                players: [...remaining],
                                hostId: nextHost,
                            },
                        };
                    }

                    case "player-ready": {
                        const updatedPlayers = gs.players.map(p => {
                            if (p.id.startsWith("cpu-")) {
                                return { ...p, ready: true }; // CPUs always ready
                            }
                            if (p.id === event.playerId) {
                                return { ...p, ready: event.ready };
                            }
                            return p;
                        });

                        return {
                            state: {
                                ...gs,
                                players: updatedPlayers,
                            },
                        };
                    }

                    case "settings-update": {
                        setTheme(event.theme as ThemeName);

                        return {
                            state: {
                                ...gs,
                                cpuCount: event.cpuCount,
                                cpuDifficulty:
                                    event.cpuDifficulty as MultiplayerState["cpuDifficulty"],
                                turnTimer: event.turnTimer,
                            },
                        };
                    }

                    case "lobby-sync": {
                        if (gs.phase === "playing") {
                            return { state: gs };
                        }

                        const normalizedPlayers = event.state.players.map(p => ({
                            ...p,
                            ready: p.id.startsWith("cpu-") ? true : p.ready,
                        }));

                        return {
                            state: {
                                ...event.state,
                                players: normalizedPlayers,
                            },
                        };
                    }

                    default:
                        return { state: gs };
                }
            });
        },
        [setTheme, onNavigate, isHost]
    );

    // ---------- Realtime channel (NOW we can safely get send) ----------
    const { send, ready } = useLobbyChannel(channelId, onLobbyEvent);

    // ---------- Host match start helper implementation (depends on send) ----------
    useEffect(() => {
        hostStartMatchRef.current = () => {
            const store = useMultiplayerStore.getState();
            const lobbyState = store.state;

            const humanPlayers = lobbyState.players;

            const cpuPlayers = Array.from({ length: lobbyState.cpuCount }).map((_, i) => ({
                id: `cpu-${i + 1}`,
                username: `CPU ${i + 1}`,
                avatarUrl: null,
                ready: true,
            }));

            const finalPlayers = [
                ...humanPlayers.filter(p => p.id === lobbyState.hostId),
                ...humanPlayers.filter(p => p.id !== lobbyState.hostId),
                ...cpuPlayers,
            ];

            const seed = crypto.randomUUID();

            // IMPORTANT: do NOT use old engine state here
            store.hostInitializeGame(
                lobbyState.cpuCount,
                lobbyState.cpuDifficulty,
                finalPlayers,
                seed
            );

            const eventsRef = ref(db, `lobbies/${lobbyState.lobbyId}/events`);
            set(eventsRef, null).then(() => {
                send({
                    type: "game-init-lite",
                    payload: {
                        players: finalPlayers,
                        cpuCount: lobbyState.cpuCount,
                        cpuDifficulty: lobbyState.cpuDifficulty,
                        turnTimer: lobbyState.turnTimer,
                        seed,
                    },
                });

                onNavigate("game");
            });
        };
    }, [send, onNavigate]);

    // ---------- Host lobby sync ----------
    useEffect(() => {
        if (!isHost) return;
        if (!ready) return;
        if (!lobbyId) return;
        if (!shouldHostSyncRef.current) return;

        const state = useMultiplayerStore.getState().state;

        send({
            type: "lobby-sync",
            state,
        });

        shouldHostSyncRef.current = false;
    }, [isHost, ready, lobbyId, send]);

    // ---------- Host / settings helpers ----------
    function updateSettings(
        newCpuCount: number,
        newDifficulty: MultiplayerState["cpuDifficulty"],
        newTheme: ThemeName,
        newTurnTimer: number | null = null
    ) {
        if (!isHost) return;

        const humanPlayers = players.length;
        if (humanPlayers + newCpuCount > MAX_PLAYERS) return;

        useMultiplayerStore.setState(prev => ({
            state: {
                ...prev.state,
                cpuCount: newCpuCount,
                cpuDifficulty: newDifficulty,
                turnTimer: newTurnTimer,
            },
        }));

        setTheme(newTheme);

        send({
            type: "settings-update",
            cpuCount: newCpuCount,
            cpuDifficulty: newDifficulty,
            theme: newTheme,
            turnTimer: newTurnTimer,
        });
    }

    const [copied, setCopied] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

    function copyInviteLink() {
        if (!lobbyId) return;

        const link = `${window.location.origin}?lobby=${lobbyId}`;
        navigator.clipboard.writeText(link).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    }

    function toggleReady(newState: boolean) {
        if (!userId) return;

        send({
            type: "player-ready",
            playerId: userId,
            ready: newState,
        });
    }

    function startMatch() {
        if (!isHost) return;
        if (!lobbyId) return;

        const state = useMultiplayerStore.getState().state;
        const humanPlayers = state.players;

        const cpuPlayers = Array.from({ length: cpuCount }).map((_, i) => ({
            id: `cpu-${i + 1}`,
            username: `CPU ${i + 1}`,
            avatarUrl: null,
            ready: true,
        }));

        const finalPlayers = [
            ...humanPlayers.filter(p => p.id === hostId),
            ...humanPlayers.filter(p => p.id !== hostId),
            ...cpuPlayers,
        ];

        const seed = crypto.randomUUID();

        hostInitializeGame(cpuCount, cpuDifficulty, finalPlayers, seed);

        const eventsRef = ref(db, `lobbies/${lobbyId}/events`);
        set(eventsRef, null).then(() => {
            send({
                type: "game-init-lite",
                payload: {
                    players: finalPlayers,
                    cpuCount,
                    cpuDifficulty,
                    turnTimer,
                    seed,
                },
            });

            setTimeout(() => {
                onNavigate("game");
            }, 50);
        });
    }

    const allReady = players.length > 0 && players.every(p => p.ready);
    const canStart = isHost && allReady && ready;

    function handleLeaveLobby() {
        if (userId) {
            send({
                type: "player-leave",
                leavingPlayerId: userId,
            });
        }

        setPlayers([]);
        setHostId(null);
        setLobbyId(null);

        onNavigate("play");
    }

    // ---------- Join effect ----------
    useEffect(() => {
        if (!ready) return;
        if (!lobbyId) return;
        if (!user?.userId) return;
        if (hasJoinedRef.current) return;

        hasJoinedRef.current = true;

        send({
            type: "player-join",
            player: {
                id: user.userId,
                username: user.username,
                avatarUrl: user.avatarUrl,
                ready: false,
            },
            isHost: isHost,
        });
    }, [ready, lobbyId, user, isHost, send]);

    // ---------- UI ---------- 
    return (
        <div
            className="
                relative flex flex-col items-center 
                justify-start pt-24
                w-full min-h-screen
                text-[var(--theme-text)] overflow-hidden
                sm:justify-center sm:pt-0
            "
            style={{
                background: ` 
                    radial-gradient(
                        circle at center,
                        rgba(255,255,255,0.08) 0%,
                        rgba(0,0,0,0.4) 60%
                    ),
                    var(--theme-bg)
                `,
            }}
        >
            {/* Felt */}
            <div className="absolute inset-0 opacity-[0.15] bg-[url('/felt.png')] bg-cover pointer-events-none"></div>

            {/* Spotlight */}
            <div
                className="absolute inset-0"
                style={{
                    background: ` 
                        radial-gradient(
                            circle at 50% 20%,
                            rgba(255,255,255,0.12) 0%,
                            rgba(0,0,0,0.75) 60%
                        )
                    `,
                }}
            />

            {/* Vignette */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: ` 
                        radial-gradient(
                            circle at center,
                            rgba(0,0,0,0) 55%,
                            rgba(0,0,0,0.35) 100%
                        )
                    `,
                }}
            />

            {/* Header */}
            <div className="relative mb-6 sm:mb-8">
                <div className="absolute inset-0 blur-[30px] opacity-20 bg-[var(--theme-accent)]"></div>
                <h2 className="relative text-3xl sm:text-4xl font-extrabold tracking-widest text-[var(--theme-accent)] drop-shadow-[0_0_10px_rgba(0,0,0,0.6)]">
                    PRIVATE MATCH
                </h2>
            </div>

            {/* Scrollable Floating Card */}
            <div
                className="
                    relative z-10 w-full max-w-[480px]
                    overflow-y-auto
                    max-h-[calc(100vh-160px)]
                    sm:max-h-none
    
                    flex flex-col items-center gap-4 sm:gap-6
                    bg-[var(--theme-surface)]/40 backdrop-blur-md border
                    border-[var(--theme-accent)]/40
                    rounded-xl px-6 sm:px-8 py-5 sm:py-6
                    shadow-[0_0_20px_rgba(0,0,0,0.4)]
                "
            >

                {/* Player List */}
                <div className="w-full mb-2 text-center">
                    <h3 className="mb-2 text-base font-semibold sm:text-lg">Players</h3>

                    <div className="flex flex-col gap-2 mb-3">
                        {players.map(p => (
                            <div
                                key={p.id}
                                className="flex items-center justify-between bg-[var(--theme-surface)]/30 border border-[var(--theme-accent)]/40 rounded-lg px-3 py-2"
                            >
                                <div className="flex items-center gap-3">
                                    <img
                                        src={
                                            p.avatarUrl ??
                                            "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                                        }
                                        className="w-8 h-8 rounded-full"
                                    />

                                    <span className="text-[var(--theme-text)]">
                                        {p.username}
                                    </span>

                                    {p.id === hostId && (
                                        <span className="ml-1 text-xs font-semibold text-green-400">
                                            Host
                                        </span>
                                    )}
                                </div>

                                {p.id === userId ? (
                                    <button
                                        onClick={() => toggleReady(!p.ready)}
                                        className="
                                            px-3 py-1 rounded-lg text-sm sm:text-base
                                            bg-[var(--theme-accent)] text-black font-semibold
                                            hover:opacity-90 transition-all
                                        "
                                    >
                                        {p.ready ? "Unready" : "Ready"}
                                    </button>
                                ) : (
                                    <span className="text-xl">
                                        {p.ready ? (
                                            <span className="text-green-400">✔</span>
                                        ) : (
                                            <span className="text-gray-400">○</span>
                                        )}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Invite Link Button */}
                    <button
                        onClick={copyInviteLink}
                        className="
                            w-full px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base
                            mb-3 rounded-lg
                            bg-[var(--theme-accent)] text-black font-semibold border
                            border-[var(--theme-accent)]
                            shadow-[0_0_10px_var(--theme-accent)]
                            hover:opacity-90 transition-all
                        "
                    >
                        {copied ? "Copied!" : "Copy Invite Link"}
                    </button>
                </div>

                {/* CPU Count */}
                {isHost && (
                    <div className="flex flex-col w-full gap-2 mt-1 sm:gap-3 sm:mt-2">
                        <h3 className="text-base font-semibold sm:text-lg">CPU Count</h3>

                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {[0, 1, 2, 3].map(count => (
                                <button
                                    key={count}
                                    onClick={() =>
                                        updateSettings(
                                            count,
                                            cpuDifficulty,
                                            theme
                                        )
                                    }
                                    className={`
                                        px-4 py-2 text-sm sm:px-5 sm:py-2 sm:text-base
                                        rounded-lg border-[2px] font-semibold tracking-wide
                                        transition-all duration-200
                                        ${cpuCount === count
                                            ? "bg-[var(--theme-accent)] text-black border-[var(--theme-accent)] shadow-[0_0_10px_var(--theme-accent)]"
                                            : "bg-[var(--theme-surface)] text-[var(--theme-text)] border-[var(--theme-accent)] opacity-70 hover:opacity-100"
                                        }
                                    `}
                                >
                                    {count === 0 ? "Friends Only" : `${count} CPU${count > 1 ? "s" : ""}`}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* CPU Difficulty */}
                {isHost && cpuCount > 0 && (
                    <div className="flex flex-col w-full gap-2 mt-1 sm:gap-3 sm:mt-2">
                        <h3 className="text-base font-semibold sm:text-lg">CPU Difficulty</h3>

                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {(["easy", "normal", "hard"] as const).map(level => (
                                <button
                                    key={level}
                                    onClick={() =>
                                        updateSettings(cpuCount, level, theme)
                                    }
                                    className={`
                                        px-4 py-2 text-sm sm:px-5 sm:py-2 sm:text-base
                                        rounded-lg border-[2px] font-semibold tracking-wide
                                        transition-all duration-200
                                        ${cpuDifficulty === level
                                            ? "bg-[var(--theme-accent)] text-black border-[var(--theme-accent)] shadow-[0_0_10px_var(--theme-accent)]"
                                            : "bg-[var(--theme-surface)] text-[var(--theme-text)] border-[var(--theme-accent)] opacity-70 hover:opacity-100"
                                        }
                                    `}
                                >
                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Turn Timer */}
                {isHost && (
                    <div className="flex flex-col w-full gap-2 mt-1 sm:gap-3 sm:mt-2">
                        <h3 className="text-base font-semibold sm:text-lg">Turn Timer</h3>

                        <div className="flex flex-wrap gap-2 sm:gap-3">
                            {[
                                { label: "Off", value: null },
                                { label: "30s", value: 30 },
                                { label: "45s", value: 45 },
                                { label: "60s", value: 60 },
                            ].map(option => (
                                <button
                                    key={option.label}
                                    onClick={() =>
                                        updateSettings(cpuCount, cpuDifficulty, theme, option.value)
                                    }
                                    className={`
                                        px-4 py-2 text-sm sm:px-5 sm:py-2 sm:text-base
                                        rounded-lg border-[2px] font-semibold tracking-wide
                                        transition-all duration-200
                                        ${turnTimer === option.value
                                            ? "bg-[var(--theme-accent)] text-black border-[var(--theme-accent)] shadow-[0_0_10px_var(--theme-accent)]"
                                            : "bg-[var(--theme-surface)] text-[var(--theme-text)] border-[var(--theme-accent)] opacity-70 hover:opacity-100"
                                        }
                                    `}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Theme Selector */}
                <div className="flex flex-col w-full gap-2 mt-1 sm:gap-3 sm:mt-2">
                    <h3 className="text-base font-semibold sm:text-lg">Theme</h3>

                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        {(["vegas", "atlantic", "highroller", "homegame"] as const).map(t => (
                            <button
                                key={t}
                                disabled={!isHost}
                                onClick={() => updateSettings(cpuCount, cpuDifficulty, t)}
                                className={`
                                    px-4 py-2 text-sm sm:px-5 sm:py-2 sm:text-base
                                    rounded-lg border-[2px] font-semibold tracking-wide
                                    transition-all duration-200
                                    ${theme === t
                                        ? "bg-[var(--theme-accent)] text-black border-[var(--theme-accent)] shadow-[0_0_10px_var(--theme-accent)]"
                                        : "bg-[var(--theme-surface)] text-[var(--theme-text)] border-[var(--theme-accent)] opacity-70 hover:opacity-100"
                                    }
                                    ${!isHost ? "cursor-not-allowed opacity-40" : ""}
                                `}
                            >
                                {t === "vegas" && "Modern Vegas"}
                                {t === "atlantic" && "Atlantic City"}
                                {t === "highroller" && "High Roller"}
                                {t === "homegame" && "Home Game"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Start Match */}
                {isHost && (
                    <button
                        onClick={startMatch}
                        disabled={!canStart}
                        className={`
                            w-full px-3 py-2 text-sm sm:px-4 sm:py-2 sm:text-base
                            mt-2 rounded-lg font-bold transition-all
                            ${allReady
                                ? "bg-[var(--theme-accent)] text-black shadow-[0_0_15px_var(--theme-accent)] animate-pulse"
                                : "bg-gray-600 text-gray-300 cursor-not-allowed opacity-60"
                            }
                        `}
                    >
                        Start Match
                    </button>
                )}

                {/* Leave Confirmation */}
                {showLeaveConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="bg-[var(--theme-surface)] p-6 rounded-lg shadow-lg text-center border border-[var(--theme-accent)]/40">
                            <p className="mb-4 text-[var(--theme-text)] text-lg font-semibold">
                                Leave the lobby?
                            </p>

                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={handleLeaveLobby}
                                    className="px-4 py-2 font-semibold text-white bg-red-500 rounded-lg"
                                >
                                    Leave Lobby
                                </button>

                                <button
                                    onClick={() => setShowLeaveConfirm(false)}
                                    className="px-4 py-2 font-semibold bg-gray-300 rounded-lg"
                                >
                                    Stay
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Back */}
                <button
                    className="w-40 mt-2 sm:w-48 menu-btn opacity-70 hover:opacity-100"
                    onClick={() => setShowLeaveConfirm(true)}
                >
                    ← Back
                </button>
            </div>
        </div>
    );
}