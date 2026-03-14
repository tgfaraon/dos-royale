import { create } from "zustand";
import type { Card, Combo } from "../game-engine/types";
import { playSound } from "../lib/playSound";

import {
    createDeck,
    shuffleDeck,
    dealHands,
    sortHand,
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

export interface AuthoritativeGameState {
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
    phase: "waiting" | "dealing" | "playing" | "gameover";

    cpuCount: number;
    cpuDifficulty: "easy" | "normal" | "hard";

    players: PlayerInfo[];
    hostId: string | null;
    lobbyId: string | null;
}

const createEmptyState = (): AuthoritativeGameState => ({
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

//
// PURE ENGINE FUNCTIONS
//

function engineInitializeGame(
    prevState: AuthoritativeGameState,
    cpuCount: number,
    cpuDifficulty: "easy" | "normal" | "hard",
    playersOverride?: PlayerInfo[]
): AuthoritativeGameState {
    const basePlayers = playersOverride ?? prevState.players;

    const cpuPlayers: PlayerInfo[] = Array.from({ length: cpuCount }).map(
        (_, i) => ({
            id: `cpu-${i + 1}`,
            username: `CPU ${i + 1}`,
            avatarUrl: null,
            ready: true,
        })
    );

    const finalPlayers = [...basePlayers, ...cpuPlayers];

    const deck = shuffleDeck(createDeck());
    const totalPlayers = finalPlayers.length;
    const hands = dealHands(deck, totalPlayers).map(sortHand);

    // Find the player with the 3♣
    let startingPlayer = 0;
    for (let i = 0; i < hands.length; i++) {
        if (hands[i].some(c => c.rank === 3 && c.suit === "clubs")) {
            startingPlayer = i;
            break;
        }
    }

    console.log("[DEBUG HANDS AT START]", {
        startingPlayer,
        hands: hands.map((hand, i) => ({
            playerIndex: i,
            cards: hand.map(c => `${c.rank}${c.suit[0]}`),
        })),
    });

    const timer = prevState.turnTimer;

    return {
        ...prevState,
        phase: "playing",
        cpuCount,
        cpuDifficulty,
        players: finalPlayers,   // no rotation
        hands,                   // no rotation
        deck,
        discardPile: [],
        trick: [],
        currentPlayerIndex: startingPlayer, // whoever has 3♣
        lastCombo: null,
        isNewRound: true,
        passesInRow: 0,
        winner: null,
        turnTimer: timer,
        turnStartedAt: timer ? Date.now() : null,
    };
}

function enginePlayCards(
    state: AuthoritativeGameState,
    playerIndex: number,
    cards: Card[]
): AuthoritativeGameState {
    console.log("[ENGINE PLAY ATTEMPT]", {
        playerIndex,
        cards,
        currentPlayerIndex: state.currentPlayerIndex,
        isNewRound: state.isNewRound,
        lastCombo: state.lastCombo,
    });

    if (state.phase !== "playing") {
        console.log("[ENGINE REJECT] wrong phase");
        return state;
    }
    if (typeof state.winner === "number") {
        console.log("[ENGINE REJECT] game already has winner");
        return state;
    }
    if (playerIndex !== state.currentPlayerIndex) {
        console.log("[ENGINE REJECT] not this player's turn");
        return state;
    }

    // FIRST TURN RULE: Must play 3♣
    if (state.isNewRound && state.lastCombo === null) {
        const hand = state.hands[playerIndex];
        const hasThreeClubs = hand.some(c => c.rank === 3 && c.suit === "clubs");

        if (hasThreeClubs) {
            const includesThreeClubs = cards.some(
                c => c.rank === 3 && c.suit === "clubs"
            );
            if (!includesThreeClubs) {
                console.log("[ENGINE REJECT] must play 3♣ on first turn");
                return state; // illegal play
            }
        }
    }

    const combo = detectCombo(cards);
    if (!combo) {
        console.log("[ENGINE REJECT] no valid combo");
        return state;
    }

    if (state.lastCombo) {
        const cmp = compareCombos(combo, state.lastCombo);
        if (combo.type !== state.lastCombo.type || cmp <= 0) {
            console.log("[ENGINE REJECT] combo does not beat lastCombo", {
                combo,
                lastCombo: state.lastCombo,
                cmp,
            });
            return state;
        }
    }

    const newHands = state.hands.map((hand, i) =>
        i === playerIndex
            ? hand.filter(c => !cards.some(x => x.id === c.id))
            : hand
    );

    const playerWon = newHands[playerIndex].length === 0;
    const nextPlayer = (state.currentPlayerIndex + 1) % newHands.length;

    const newState: AuthoritativeGameState = {
        ...state,
        hands: newHands,
        lastCombo: combo,
        isNewRound: false,
        passesInRow: 0,
        currentPlayerIndex: nextPlayer,
        winner: playerWon ? playerIndex : null,
        turnTimer: state.turnTimer,
        turnStartedAt: state.turnTimer ? Date.now() : null,
    };

    console.log("[ENGINE PLAY ACCEPTED]", {
        playerIndex,
        combo,
        nextPlayer,
        isNewRound: newState.isNewRound,
        lastCombo: newState.lastCombo,
    });

    return newState;
}

function enginePassTurn(
    state: AuthoritativeGameState,
    playerIndex: number
): AuthoritativeGameState {
    if (state.phase !== "playing") return state;
    if (typeof state.winner === "number") return state;
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

function engineCpuTakeTurn(
    state: AuthoritativeGameState,
    playerIndex: number
): AuthoritativeGameState {
    const playerInfo = state.players[playerIndex];
    if (!playerInfo || !playerInfo.id.startsWith("cpu-")) return state;

    const hand = state.hands[playerIndex];

    // FIRST TURN RULE: Must play 3♣
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

//
// ZUSTAND STORE
//

export const useGameStore = create<{
    gameState: AuthoritativeGameState;
    setGameState: (partial: Partial<AuthoritativeGameState>) => void;
    resetMatchState: () => void;
    resetEngineState: () => void;

    singleInitializeGame: (cpuCount: number, cpuDifficulty: "easy" | "normal" | "hard") => void;
    singlePlayCards: (cards: Card[]) => void;
    singlePassTurn: () => void;
    singleCpuTurn: () => void;

    hostInitializeGame: (
        cpuCount: number,
        cpuDifficulty: "easy" | "normal" | "hard",
        playersOverride?: PlayerInfo[]
    ) => void;
    hostPlayCards: (playerIndex: number, cards: Card[]) => AuthoritativeGameState;
    hostPassTurn: (playerIndex: number) => AuthoritativeGameState;
    hostCpuTakeTurn: (playerIndex: number) => AuthoritativeGameState;

    requestPlay: () => void;
    requestPass: () => void;

    setPlayers: (
        updater: PlayerInfo[] | ((prev: PlayerInfo[]) => PlayerInfo[])
    ) => void;
    setHostId: (id: string | null) => void;
    setLobbyId: (id: string | null) => void;

    selectedCards: Card[];
    toggleCardSelection: (card: Card) => void;
    clearSelection: () => void;
}>((set, get) => ({
    gameState: createEmptyState(),

    setGameState: (partial: Partial<AuthoritativeGameState>) =>
        set((prev: { gameState: AuthoritativeGameState }) => ({
            gameState: {
                ...prev.gameState,
                ...partial,
            },
        })),

    resetMatchState: () =>
        set((state) => ({
            gameState: {
                ...state.gameState,
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
            }
        })),

    resetEngineState: () =>
        set((state) => ({
            gameState: {
                ...state.gameState,   // preserve lobby metadata + players
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
            }
        })),

    //
    // SINGLEPLAYER
    //

    singleInitializeGame: (cpuCount, cpuDifficulty) => {
        const prev = get().gameState;

        const playersOverride: PlayerInfo[] = [
            {
                id: "player-0",
                username: "You",
                avatarUrl: null,
                ready: true
            }
        ];

        const newState = engineInitializeGame(prev, cpuCount, cpuDifficulty, playersOverride);
        set({ gameState: newState });
    },

    singlePlayCards: (cards: Card[]) => {
        const state = get().gameState;
        const newState = enginePlayCards(state, state.currentPlayerIndex, cards);
        set({ gameState: newState });
    },

    singlePassTurn: () => {
        const state = get().gameState;
        const newState = enginePassTurn(state, state.currentPlayerIndex);
        set({ gameState: newState });
    },

    singleCpuTurn: () => {
        const state = get().gameState;
        const newState = engineCpuTakeTurn(state, state.currentPlayerIndex);
        set({ gameState: newState });
    },

    //
    // MULTIPLAYER HOST
    //

    hostInitializeGame: (
        cpuCount: number,
        cpuDifficulty: "easy" | "normal" | "hard",
        playersOverride?: PlayerInfo[]
    ) => {
        const prev = get().gameState;

        // use whatever was chosen in the lobby (30/45/60/off)
        const base = { ...prev, turnTimer: prev.turnTimer };

        const newState = engineInitializeGame(base, cpuCount, cpuDifficulty, playersOverride);
        set({ gameState: newState });
    },

    hostPlayCards: (playerIndex: number, cards: Card[]) => {
        playSound("card-slap");
        const state = get().gameState;
        const newState = enginePlayCards(state, playerIndex, cards);
        set({ gameState: newState });
        return newState;
    },

    hostPassTurn: (playerIndex: number) => {
        playSound("pass");
        const state = get().gameState;
        const newState = enginePassTurn(state, playerIndex);
        set({ gameState: newState });
        return newState;
    },

    hostCpuTakeTurn: (playerIndex: number) => {
        const state = get().gameState;
        const newState = engineCpuTakeTurn(state, playerIndex);
        set({ gameState: newState });
        return newState;
    },

    //
    // MULTIPLAYER GUEST INTENT
    //

    requestPlay: () => { },
    requestPass: () => { },

    //
    // LOBBY
    //

    setPlayers: (
        updater: PlayerInfo[] | ((prev: PlayerInfo[]) => PlayerInfo[])
    ) =>
        set((state: { gameState: AuthoritativeGameState }) => {
            const prev = state.gameState.players;
            const next =
                typeof updater === "function" ? updater(prev) : updater;

            return {
                gameState: {
                    ...state.gameState,
                    players: next,
                },
            };
        }),

    setHostId: (id: string | null) =>
        set((state: { gameState: AuthoritativeGameState }) => ({
            gameState: { ...state.gameState, hostId: id },
        })),

    setLobbyId: (id: string | null) =>
        set((state: { gameState: AuthoritativeGameState }) => ({
            gameState: { ...state.gameState, lobbyId: id },
        })),

    //
    // UI
    //

    selectedCards: [],
    toggleCardSelection: (card: Card) =>
        set((state: { selectedCards: Card[] }) => {
            const exists = state.selectedCards.some(c => c.id === card.id);
            return {
                selectedCards: exists
                    ? state.selectedCards.filter((c: Card) => c.id !== card.id)
                    : [...state.selectedCards, card],
            };
        }),

    clearSelection: () => set({ selectedCards: [] }),
}));

declare global {
    interface Window {
        useGameStore?: typeof useGameStore;
    }
}

if (typeof window !== "undefined") {
    window.useGameStore = useGameStore;
}    