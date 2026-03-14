import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { useGameStore, MAX_PLAYERS } from "../../stores/gameStore";
import { useUserStore } from "../../stores/userStore";
import { useThemeStore } from "../../stores/themeStore";
import { useLobbyChannel, type LobbyEvent } from "../../hooks/useLobbyChannel";
import { ref, set } from "firebase/database";
import { db } from "../../lib/firebase";
import type { Screen } from "../../types/Screen";

interface PrivateMatchLobbyProps {
    onNavigate: (screen: Screen) => void;
}

export default function PrivateMatchLobby({ onNavigate }: PrivateMatchLobbyProps) {
    // ---------- Zustand state ----------
    const hostId = useGameStore(s => s.gameState.hostId);
    const players = useGameStore(s => s.gameState.players);
    const lobbyId = useGameStore(s => s.gameState.lobbyId);
    const cpuCount = useGameStore(s => s.gameState.cpuCount);
    const cpuDifficulty = useGameStore(s => s.gameState.cpuDifficulty);
    const turnTimer = useGameStore(s => s.gameState.turnTimer);

    const setPlayers = useGameStore(s => s.setPlayers);
    const setHostId = useGameStore(s => s.setHostId);
    const setLobbyId = useGameStore(s => s.setLobbyId);

    const hostInitializeGame = useGameStore(s => s.hostInitializeGame);

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

    console.log("[LOBBY RENDER] players", players);
    console.log("[LOBBY RENDER] hostId", hostId);
    console.log("[LOBBY RENDER] lobbyId", lobbyId);

    // ---------- Lobby event handler ----------
    const onLobbyEvent = useCallback(
        (event: LobbyEvent) => {
            console.log("[LOBBY EVENT]", event);

            // Ignore pure game events in the lobby
            if (
                event.type === "turn-update" ||
                event.type === "round-end" ||
                event.type === "game-over"
            ) {
                return;
            }

            // --- GAME INIT: hydrate BOTH host and guest, then navigate ---
            if (event.type === "game-init") {
                console.log("[GAME_INIT EVENT STATE", {
                    players: event.state.players,
                    winner: event.state.winner,
                    handsLen: event.state.hands?.length,
                });

                useGameStore.setState(() => ({
                    gameState: { ...event.state },
                }));

                onNavigate("game");
                return;
            }

            // --- All other lobby events go through the updater ---
            useGameStore.setState(prev => {
                const gs = prev.gameState;

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

                        const isHostMe = userId === event.player.id && event.isHost;
                        const isGuestJoining = !event.isHost;

                        if (isHostMe && isGuestJoining) {
                            shouldHostSyncRef.current = true;
                        }

                        return {
                            gameState: {
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
                            gameState: {
                                ...gs,
                                players: [...remaining],
                                hostId: nextHost,
                            },
                        };
                    }

                    case "player-ready": {
                        return {
                            gameState: {
                                ...gs,
                                players: gs.players.map(p =>
                                    p.id === event.playerId
                                        ? { ...p, ready: event.ready }
                                        : p
                                ),
                            },
                        };
                    }

                    case "settings-update": {
                        setTheme(event.theme);

                        return {
                            gameState: {
                                ...gs,
                                cpuCount: event.cpuCount,
                                cpuDifficulty: event.cpuDifficulty,
                                turnTimer: event.turnTimer,
                            },
                        };
                    }

                    case "lobby-sync": {
                        if (JSON.stringify(gs) === JSON.stringify(event.state)) {
                            return { gameState: gs };
                        }

                        return {
                            gameState: { ...event.state },
                        };
                    }

                    default:
                        return { gameState: gs };
                }
            });
        },
        [setTheme, userId, onNavigate]
    );

    // ---------- Realtime channel ----------
    const channelId = lobbyId;
    const { send, ready } = useLobbyChannel(channelId, onLobbyEvent);

    console.log("CHANNEL ID", channelId);

    // ---------- Host lobby sync (authoritative snapshot when a guest joins) ----------
    useEffect(() => {
        if (!isHost) return;
        if (!ready) return;
        if (!lobbyId) return;
        if (!shouldHostSyncRef.current) return;

        const state = useGameStore.getState().gameState;

        send({
            type: "lobby-sync",
            state,
        });

        shouldHostSyncRef.current = false;
    }, [isHost, ready, lobbyId, send]);

    // ---------- Host / settings helpers ----------
    function updateSettings(
        newCpuCount: number,
        newDifficulty: "easy" | "normal" | "hard",
        newTheme: "vegas" | "atlantic" | "highroller" | "homegame",
        newTurnTimer: number | null = null
    ) {
        if (!isHost) return;

        const humanPlayers = players.length;
        if (humanPlayers + newCpuCount > MAX_PLAYERS) return;

        useGameStore.setState(prev => ({
            gameState: {
                ...prev.gameState,
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

        const state = useGameStore.getState().gameState;
        const finalPlayers = state.players;

        hostInitializeGame(cpuCount, cpuDifficulty, finalPlayers);

        const eventsRef = ref(db, `lobbies/${lobbyId}/events`);
        set(eventsRef, null).then(() => {
            send({
                type: "game-init",
                state: useGameStore.getState().gameState,
            });

            onNavigate("game");
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

    // ---------- Join effect (everyone) ----------
    useEffect(() => {
        console.log("LOBBY ID AT JOIN", lobbyId);

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
            className="relative flex flex-col items-center justify-center w-full h-screen text-[var(--theme-text)] overflow-hidden"
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
            <div className="relative mb-8">
                <div className="absolute inset-0 blur-[30px] opacity-20 bg-[var(--theme-accent)]"></div>
                <h2 className="relative text-4xl font-extrabold tracking-widest text-[var(--theme-accent)] drop-shadow-[0_0_10px_rgba(0,0,0,0.6)]">
                    PRIVATE MATCH
                </h2>
            </div>

            {/* Floating Card */}
            <div
                className=" 
                    relative z-10 flex flex-col items-center gap-6
                    bg-[var(--theme-surface)]/40 backdrop-blur-md border
                    border-[var(--theme-accent)]/40
                    rounded-xl px-8 py-6 shadow-[0_0_20px_rgba(0,0,0,0.4)]
                "
            >
                {/* Player List */}
                <div className="w-full mb-4 text-center">
                    <h3 className="mb-2 text-lg font-semibold">Players</h3>

                    <div className="flex flex-col gap-2 mb-4">
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
                                        px-3 py-1 rounded-lg
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
                            w-full px-4 py-2 mb-4 rounded-lg
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
                    <div className="flex flex-col gap-3 mt-2">
                        <h3 className="text-lg font-semibold text-[var(--theme-text)]">
                            CPU Count
                        </h3>

                        <div className="flex gap-3">
                            {[0, 1, 2, 3].map(count => (
                                <button
                                    key={count}
                                    onClick={() =>
                                        updateSettings(
                                            count,
                                            cpuDifficulty,
                                            theme as "vegas" | "atlantic" | "highroller" | "homegame"
                                        )
                                    }
                                    className={` 
                                        px-5 py-2 rounded-lg border-[2px] font-semibold tracking-wide
                                        transition-all duration-200
                                        ${cpuCount === count
                                            ? "bg-[var(--theme-accent)] text-black border-[var(--theme-accent)] shadow-[0_0_10px_var(--theme-accent)]"
                                            : "bg-[var(--theme-surface)] text-[var(--theme-text)] border-[var(--theme-accent)] opacity-70 hover:opacity-100"
                                        } 
                                    `}
                                >
                                    {count === 0
                                        ? "Friends Only"
                                        : `${count} CPU${count > 1 ? "s" : ""}`}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* CPU Difficulty */}
                {isHost && cpuCount > 0 && (
                    <div className="flex flex-col gap-3 mt-2">
                        <h3 className="text-lg font-semibold text-[var(--theme-text)]">
                            CPU Difficulty
                        </h3>

                        <div className="flex gap-3">
                            {(["easy", "normal", "hard"] as Array<
                                "easy" | "normal" | "hard"
                            >).map(level => (
                                <button
                                    key={level}
                                    onClick={() =>
                                        updateSettings(
                                            cpuCount,
                                            level,
                                            theme
                                        )
                                    }
                                    className={` 
                                            px-5 py-2 rounded-lg border-[2px] font-semibold tracking-wide
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
                    <div className="flex flex-col gap-3 mt-2">
                        <h3 className="text-lg font-semibold text-[var(--theme-text)]">
                            Turn Timer
                        </h3>

                        <div className="flex gap-3">
                            {[
                                { label: "Off", value: null },
                                { label: "30s", value: 30 },
                                { label: "45s", value: 45 },
                                { label: "60s", value: 60 },
                            ].map(option => (
                                <button
                                    key={option.label}
                                    onClick={() =>
                                        updateSettings(
                                            cpuCount,
                                            cpuDifficulty,
                                            theme as "vegas" | "atlantic" | "highroller" | "homegame",
                                            option.value
                                        )
                                    }
                                    className={` 
                                        px-5 py-2 rounded-lg border-[2px] font-semibold tracking-wide
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
                <div className="flex flex-col gap-3 mt-2">
                    <h3 className="text-lg font-semibold text-[var(--theme-text)]">
                        Theme
                    </h3>

                    <div className="flex gap-3">
                        {(
                            ["vegas", "atlantic", "highroller", "homegame"] as Array<
                                "vegas" | "atlantic" | "highroller" | "homegame"
                            >
                        ).map(t => (
                            <button
                                key={t}
                                disabled={!isHost}
                                onClick={() => updateSettings(cpuCount, cpuDifficulty, t)}
                                className={` 
                                    px-5 py-2 rounded-lg border-[2px] font-semibold tracking-wide
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
                            w-full px-4 py-2 mt-2 rounded-lg font-bold transition-all
                            ${allReady
                                ? "bg-[var(--theme-accent)] text-black shadow-[0_0_15px_var(--theme-accent)] animate-pulse"
                                : "bg-gray-600 text-gray-300 cursor-not-allowed opacity-60"
                            } 
                        `}
                    >
                        Start Match
                    </button>
                )}

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
                                > Stay
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Back */}
                <button
                    className="w-48 menu-btn opacity-70 hover:opacity-100"
                    onClick={() => setShowLeaveConfirm(true)}
                >
                    ← Back
                </button>
            </div>
        </div>
    );
}