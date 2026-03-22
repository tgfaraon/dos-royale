import { PlayerHand } from "../../players/PlayerHand";
import { CpuHand } from "../../players/CpuHand";
import { TableArea } from "../../game/TableArea";
import { ActionBar } from "../../game/ActionBar";
import { GameOverModal } from "../../ui/GameOverModal";
import { useMultiplayerStore } from "../../../stores/multiplayerGameStore"

import type { Card as CardType } from "../../../game-engine/types";
import type { PlayerInfo } from "../../../stores/singleplayerGameStore";
import type { ThemeName } from "../../../stores/themeStore";
import type { Combo } from "../../../game-engine/types";

interface OpponentHandProps {
    username: string;
    cardCount: number;
    isActive: boolean;
    position: "top" | "left" | "right";
}

function OpponentHand({ username, cardCount, isActive, position }: OpponentHandProps) {
    return (
        <div className="flex flex-col items-center text-white">
            <div className={`text-sm mb-1 ${isActive ? "font-bold text-yellow-300" : ""}`}>
                {username}
            </div>
            <CpuHand position={position} count={cardCount} isActive={isActive} />
        </div>
    );
}

function TimerBubble({ timeLeft }: { timeLeft: number | null }) {
    if (timeLeft === null) return null;

    return (
        <div className="px-2 py-1 text-xs font-semibold text-white rounded-full shadow-md bg-black/60">
            {timeLeft}s
        </div>
    );
}

export interface GameBoardViewProps {
    players: PlayerInfo[];
    rotatedPlayers: PlayerInfo[];
    rotatedHands: CardType[][];
    playerHand: CardType[];
    activeSeatIndex: number | null;
    selected: Set<string>;
    isMyTurn: boolean;
    timeLeft: number | null;
    winner: number | null;
    gamePhase: string;
    lastCombo: Combo | null;

    theme: ThemeName;
    themeVars: Record<string, string>;
    isHomeGame: boolean;
    menuOpen: boolean;

    onToggleCard: (card: CardType) => void;
    onPlay: () => void;
    onPass: () => void;
    onPlayAgain: () => void;
    onLeaveLobby?: () => void;
    setMenuOpen: (open: boolean) => void;
    setTheme: (t: ThemeName) => void;

    seatingMode: "fixed" | "rotated";
}

export function GameBoardView(props: GameBoardViewProps) {
    const {
        players,
        rotatedPlayers,
        rotatedHands,
        playerHand,
        activeSeatIndex,
        selected,
        isMyTurn,
        timeLeft,
        winner,
        gamePhase,
        lastCombo,

        theme,
        themeVars,
        isHomeGame,
        menuOpen,

        onToggleCard,
        onPlay,
        onPass,
        onPlayAgain,
        onLeaveLobby,
        setMenuOpen,
        setTheme,

        seatingMode,
    } = props;

    console.log("[GAME MOUNT]", useMultiplayerStore.getState().state);

    const safeWinner = typeof winner === "number" ? winner : null;

    // --- Seating Mode Handling ---

    let viewPlayers = rotatedPlayers;
    let viewHands = rotatedHands;
    let viewActiveSeat = activeSeatIndex;

    // Singleplayer: remap seats visually so human is always bottom
    if (seatingMode === "fixed") {
        const humanSeat = players.findIndex(p => !p.id.startsWith("cpu-"));

        const order = [0, 1, 2, 3].map(
            offset => (humanSeat + offset) % players.length
        );

        viewPlayers = order.map(i => players[i]);
        viewHands = order.map(i => rotatedHands[i]);
        viewActiveSeat =
            activeSeatIndex === null
                ? null
                : order.indexOf(activeSeatIndex);
    }

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
                    className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
                />
            )}

            {/* MENU PANEL */}
            {menuOpen && (
                <div
                    className="
            fixed top-4 right-4 z-[9999]
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

                    {/* Start New Game */}
                    <button
                        onClick={onPlayAgain}
                        className="
                w-full mb-3 px-3 py-2 rounded
                bg-[var(--theme-accent)] text-black font-semibold
                hover:brightness-110 transition-all
            "
                    >
                        Start New Game
                    </button>

                    {/* Exit */}
                    {onLeaveLobby && (
                        <button
                            onClick={onLeaveLobby}
                            className="
                    w-full px-3 py-2 rounded
                    bg-black/40 text-[var(--theme-text)]
                    border border-[var(--theme-accent)]
                    hover:brightness-110 transition-all
                "
                        >
                            Leave Lobby
                        </button>
                    )}
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
                <div
                    className="p-2 rounded-full shadow-inner"
                    style={{ boxShadow: "inset 0 0 28px rgba(0,0,0,0.55)" }}
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
                            background: isHomeGame
                                ? themeVars["--wood-base"]
                                : themeVars["--felt-color"],
                            boxShadow: `0 0 40px ${isHomeGame
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

                        {/* Felt texture */}
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
                        {viewPlayers[2] && (
                            <>
                                {viewActiveSeat === 2 && (
                                    <div className="absolute right-4 -top-2">
                                        <TimerBubble timeLeft={timeLeft} />
                                    </div>
                                )}

                                <div
                                    className="absolute left-1/2"
                                    style={{ top: "6%", transform: "translateX(-50%) rotate(2deg)" }}
                                >
                                    {viewPlayers[2].id.startsWith("cpu-") ? (
                                        <CpuHand
                                            position="top"
                                            count={viewHands[2]?.length ?? 0}
                                            isActive={viewActiveSeat === 2}
                                        />
                                    ) : (
                                        <OpponentHand
                                            username={viewPlayers[2].username}
                                            cardCount={viewHands[2]?.length ?? 0}
                                            isActive={viewActiveSeat === 2}
                                            position="top"
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        {/* LEFT SEAT */}
                        {viewPlayers[3] && (
                            <>
                                {viewActiveSeat === 3 && (
                                    <div className="absolute top-0 -translate-x-1/2 -translate-y-full left-1/2">
                                        <TimerBubble timeLeft={timeLeft} />
                                    </div>
                                )}

                                <div
                                    className="absolute"
                                    style={{ left: "4%", top: "28%", transform: "rotate(-8deg)" }}
                                >
                                    {viewPlayers[3].id.startsWith("cpu-") ? (
                                        <CpuHand
                                            position="left"
                                            count={viewHands[3]?.length ?? 0}
                                            isActive={viewActiveSeat === 3}
                                        />
                                    ) : (
                                        <OpponentHand
                                            username={viewPlayers[3].username}
                                            cardCount={viewHands[3]?.length ?? 0}
                                            isActive={viewActiveSeat === 3}
                                            position="left"
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        {/* RIGHT SEAT */}
                        {rotatedPlayers[1] && (
                            <>
                                {viewActiveSeat === 1 && (
                                    <div className="absolute top-0 -translate-x-1/2 -translate-y-full left-1/2">
                                        <TimerBubble timeLeft={timeLeft} />
                                    </div>
                                )}

                                <div
                                    className="absolute"
                                    style={{ right: "4%", top: "28%", transform: "rotate(8deg)" }}
                                >
                                    {rotatedPlayers[1].id.startsWith("cpu-") ? (
                                        <CpuHand
                                            position="right"
                                            count={rotatedHands[1]?.length ?? 0}
                                            isActive={viewActiveSeat === 1}
                                        />
                                    ) : (
                                        <OpponentHand
                                            username={rotatedPlayers[1].username}
                                            cardCount={rotatedHands[1]?.length ?? 0}
                                            isActive={viewActiveSeat === 1}
                                            position="right"
                                        />
                                    )}
                                </div>
                            </>
                        )}

                        {/* PLAYER (BOTTOM) */}
                        <div className="absolute flex flex-col items-center gap-3 -translate-x-1/2 bottom-2 left-1/2 z-[999]">
                            {viewActiveSeat === 0 && (
                                <div className="absolute right-4 bottom-32">
                                    <TimerBubble timeLeft={timeLeft} />
                                </div>
                            )}

                            <PlayerHand
                                hand={playerHand}
                                selected={selected}
                                toggleCard={onToggleCard}
                                isActive={viewActiveSeat === 0}
                            />

                            <ActionBar
                                onPlay={onPlay}
                                onPass={onPass}
                                disabled={!isMyTurn}
                            />
                        </div>

                        {/* WINNER */}
                        {gamePhase === "gameover" && winner !== null && (
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
                            players={players}
                            localPlayerId={null}
                            onPlayAgain={onPlayAgain}
                            onLeaveLobby={onLeaveLobby}
                            isMultiplayer={!!onLeaveLobby}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}