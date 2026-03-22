import { create } from "zustand";
import type { Card, Combo } from "../game-engine/types";
import { playSound } from "../lib/playSound";
import { ref, set as fbSet } from "firebase/database";
import { db } from "../lib/firebase";

import {
    createDeck,
    shuffleDeck,
    dealHands,
    sortHand,
    shuffleDeckWithSeed,
} from "../game-engine/state/deck";

import { detectCombo, findCombos } from "../game-engine/rules/combos";
import { compareCombos } from "../game-engine/rules/compare";

export const MAX_PLAYERS = 4;

export interface PlayerInfo {
    id: string;
    username: string;
    avatarUrl: string | null;
    ready: boolean;
}

export interface MultiplayerState {
    hands: Card[][];
    currentPlayerIndex: number;
    lastCombo: Combo | null;
    isNewRound: boolean;
    passesInRow: number;

    trick: Card[];
    deck: Card[];
    discardPile: Card[];

    turnTimer: number | null;
    turnStartedAt: number | null;

    winner: number | null;
    phase: "waiting" | "playing" | "gameover";

    cpuCount: number;
    cpuDifficulty: "easy" | "normal" | "hard";

    players: PlayerInfo[];
    hostId: string | null;
    lobbyId: string | null;
}

const createEmptyState = (): MultiplayerState => ({
    hands: [],
    currentPlayerIndex: 0,
    lastCombo: null,
    isNewRound: true,
    passesInRow: 0,

    trick: [],
    deck: [],
    discardPile: [],

    turnTimer: null,
    turnStartedAt: null,

    winner: null,
    phase: "waiting",

    cpuCount: 0,
    cpuDifficulty: "normal",

    players: [],
    hostId: null,
    lobbyId: null,
});

function engineInitializeGame(
    prev: MultiplayerState,
    cpuCount: number,
    cpuDifficulty: "easy" | "normal" | "hard",
    playersOverride: PlayerInfo[],
    seed: string
): MultiplayerState {

    const basePlayers = playersOverride;

    const deck = seed
        ? shuffleDeckWithSeed(createDeck(), seed)
        : shuffleDeck(createDeck());

    const dealtHands = dealHands(deck, basePlayers.length).map(sortHand);

    let startingPlayer = 0;
    for (let i = 0; i < dealtHands.length; i++) {
        if (dealtHands[i].some(c => c.rank === 3 && c.suit === "clubs")) {
            startingPlayer = i;
            break;
        }
    }

    return {
        players: basePlayers,
        cpuCount,
        cpuDifficulty,
        turnTimer: prev.turnTimer,
        hostId: prev.hostId,
        lobbyId: prev.lobbyId,

        hands: dealtHands,
        deck,
        discardPile: [],
        trick: [],
        currentPlayerIndex: startingPlayer,
        lastCombo: null,
        isNewRound: true,
        passesInRow: 0,
        winner: null,
        phase: "playing",

        turnStartedAt: prev.turnTimer ? Date.now() : null,
    };
}

function enginePlayCards(
    state: MultiplayerState,
    playerIndex: number,
    cards: Card[]
): MultiplayerState {
    // ❗ Clone the state immediately so we never mutate the original
    const gs = structuredClone(state);

    console.log("[ENGINE] playCards start", {
        phase: gs.phase,
        winner: gs.winner,
        currentPlayerIndex: gs.currentPlayerIndex,
        playerIndex,
        isNewRound: gs.isNewRound,
        lastCombo: gs.lastCombo,
    });

    if (gs.phase !== "playing") return state;
    if (gs.winner !== null) return state;
    if (playerIndex !== gs.currentPlayerIndex) return state;

    const hand = gs.hands[playerIndex];

    // ---------- 3C rule ----------
    if (gs.isNewRound && gs.lastCombo === null) {
        const hasThreeClubs = hand.some(c => c.rank === 3 && c.suit === "clubs");
        const includesThreeClubs = cards.some(
            c => c.rank === 3 && c.suit === "clubs"
        );

        console.log("[ENGINE] 3C rule", { hasThreeClubs, includesThreeClubs });

        if (hasThreeClubs && !includesThreeClubs) {
            console.log("[ENGINE] reject: 3C must be included");
            return state; // return original, untouched state
        }
    }

    const combo = detectCombo(cards);
    console.log("[ENGINE] combo", combo);

    if (!combo) return state;

    if (gs.lastCombo) {
        const cmp = compareCombos(combo, gs.lastCombo);
        if (combo.type !== gs.lastCombo.type || cmp <= 0) return state;
    }

    // ---------- Apply successful play ----------
    const newHands = gs.hands.map((hand, i) =>
        i === playerIndex
            ? hand.filter(c => !cards.some(x => x.id === c.id))
            : hand
    );

    const playerWon = newHands[playerIndex].length === 0;
    const nextPlayer = (gs.currentPlayerIndex + 1) % newHands.length;

    return {
        ...gs,
        hands: newHands,
        lastCombo: combo,
        isNewRound: false,
        passesInRow: 0,
        currentPlayerIndex: nextPlayer,
        winner: playerWon ? playerIndex : null,
        phase: playerWon ? "gameover" : "playing",
        turnTimer: gs.turnTimer,
        turnStartedAt: gs.turnTimer ? Date.now() : null,
    };
}

function enginePassTurn(
    state: MultiplayerState,
    playerIndex: number
): MultiplayerState {
    if (state.phase !== "playing") return state;
    if (state.winner !== null) return state;
    if (playerIndex !== state.currentPlayerIndex) return state;

    const totalPlayers = state.hands.length;
    const nextPlayer = (state.currentPlayerIndex + 1) % totalPlayers;
    const newPassCount = state.passesInRow + 1;

    if (newPassCount >= totalPlayers - 1) {
        return {
            ...state,
            currentPlayerIndex: nextPlayer,
            passesInRow: 0,
            lastCombo: null,
            isNewRound: true,
            turnTimer: state.turnTimer,
            turnStartedAt: state.turnTimer ? Date.now() : null,
        };
    }

    return {
        ...state,
        currentPlayerIndex: nextPlayer,
        passesInRow: newPassCount,
        turnTimer: state.turnTimer,
        turnStartedAt: state.turnTimer ? Date.now() : null,
    };
}

function engineCpuTakeTurn(state: MultiplayerState): MultiplayerState {
    const playerIndex = state.currentPlayerIndex;
    const player = state.players[playerIndex];

    if (!player || !player.id.startsWith("cpu-")) return state;

    const hand = state.hands[playerIndex];

    if (state.isNewRound && state.lastCombo === null) {
        const threeClubs = hand.find(c => c.rank === 3 && c.suit === "clubs");
        if (threeClubs) {
            return enginePlayCards(state, playerIndex, [threeClubs]);
        }
    }

    const combos = findCombos(hand);
    const last = state.lastCombo;

    const valid = combos.filter(c => {
        if (!last) return true;
        if (c.type !== last.type) return false;
        return compareCombos(c, last) > 0;
    });

    if (valid.length > 0) {
        const chosen = valid.sort((a, b) => compareCombos(a, b))[0];
        return enginePlayCards(state, playerIndex, chosen.cards);
    }

    return enginePassTurn(state, playerIndex);
}

export const useMultiplayerStore = create<{
    state: MultiplayerState;

    hostInitializeGame: (
        cpuCount: number,
        difficulty: "easy" | "normal" | "hard",
        playersOverride: PlayerInfo[],
        seed: string
    ) => MultiplayerState;

    hostPlayCards: (playerIndex: number, cards: Card[]) => MultiplayerState;
    hostPassTurn: (playerIndex: number) => MultiplayerState;
    hostCpuTakeTurn: (playerIndex: number) => MultiplayerState;

    resetEngineState: () => void;

    setPlayers: (
        updater: PlayerInfo[] | ((prev: PlayerInfo[]) => PlayerInfo[])
    ) => void;

    setHostId: (id: string | null) => void;
    setLobbyId: (id: string | null) => void;

    recordLeaderboardResult: (finalState: MultiplayerState) => void;
}>(set => ({
    state: createEmptyState(),

    hostInitializeGame: (cpuCount, difficulty, playersOverride, seed) => {
        let newState: MultiplayerState;

        set(s => {
            // 1. Start from a clean engine state
            const baseState: MultiplayerState = {
                players: playersOverride,
                cpuCount,
                cpuDifficulty: difficulty,
                turnTimer: s.state.turnTimer, // keep lobby setting
                hostId: s.state.hostId,
                lobbyId: s.state.lobbyId,

                // Fresh engine fields
                hands: [],
                currentPlayerIndex: 0,
                lastCombo: null,
                isNewRound: true,
                passesInRow: 0,
                trick: [],
                deck: [],
                discardPile: [],
                winner: null,
                turnStartedAt: null,
                phase: "waiting",
            };

            // 2. Now safely initialize the new match
            newState = engineInitializeGame(
                baseState,
                cpuCount,
                difficulty,
                playersOverride,
                seed
            );

            return { state: newState };
        });

        return newState!;
    },

    hostPlayCards: (playerIndex, cards) => {
        playSound("card-slap");
        let newState: MultiplayerState;
        set(s => {
            newState = enginePlayCards(s.state, playerIndex, cards);
            return { state: newState };
        });
        return newState!;
    },

    hostPassTurn: playerIndex => {
        playSound("pass");
        let newState: MultiplayerState;
        set(s => {
            newState = enginePassTurn(s.state, playerIndex);
            return { state: newState };
        });
        return newState!;
    },

    hostCpuTakeTurn: playerIndex => {
        let newState: MultiplayerState;
        set(s => {
            if (playerIndex !== s.state.currentPlayerIndex) {
                newState = s.state;
                return { state: s.state };
            }
            newState = engineCpuTakeTurn(s.state);
            return { state: newState };
        });
        return newState!;
    },

    resetEngineState: () =>
        set(s => {
            const prev = s.state;

            return {
                state: {
                    ...prev,

                    // Reset gameplay
                    hands: [],
                    currentPlayerIndex: 0,
                    lastCombo: null,
                    isNewRound: true,
                    passesInRow: 0,
                    trick: [],
                    deck: [],
                    discardPile: [],
                    winner: null,
                    phase: "waiting",

                    // Reset lobby readiness
                    players: prev.players.map(p => ({
                        ...p,
                        ready: false,
                    })),
                },
            };
        }),

    setPlayers: updater =>
        set(s => {
            const prev = s.state.players;
            const next =
                typeof updater === "function" ? updater(prev) : updater;
            return { state: { ...s.state, players: next } };
        }),

    setHostId: id =>
        set(s => ({ state: { ...s.state, hostId: id } })),

    setLobbyId: id =>
        set(s => ({ state: { ...s.state, lobbyId: id } })),

    recordLeaderboardResult: finalState => {
        try {
            const lobbyId = finalState.lobbyId;
            const hostId = finalState.hostId;

            if (!lobbyId || !hostId) return;

            const humansOnly = finalState.players.filter(
                p => !p.id.startsWith("cpu-")
            );

            const resultRef = ref(db, `leaderboard/${lobbyId}/${Date.now()}`);

            fbSet(resultRef, {
                winner: finalState.winner,
                players: humansOnly,
                timestamp: Date.now(),
            });
        } catch (err) {
            console.error("[LEADERBOARD ERROR]", err);
        }
    },
}));