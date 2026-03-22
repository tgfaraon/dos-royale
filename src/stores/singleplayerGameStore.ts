import { create } from "zustand";
import type { Card, Combo } from "../game-engine/types";
import {
    createDeck,
    shuffleDeck,
    dealHands,
    sortHand,
} from "../game-engine/state/deck";
import { detectCombo, findCombos } from "../game-engine/rules/combos";
import { compareCombos } from "../game-engine/rules/compare";

export interface PlayerInfo {
    id: string;
    username: string;
    avatarUrl: string | null;
    ready: boolean;
}

export interface SingleplayerState {
    hands: Card[][];
    currentPlayerIndex: number;
    lastCombo: Combo | null;
    isNewRound: boolean;
    passesInRow: number;

    trick: Card[];
    deck: Card[];
    discardPile: Card[];

    winner: number | null;
    phase: "waiting" | "playing" | "gameover";

    cpuCount: number;
    cpuDifficulty: "easy" | "normal" | "hard";

    players: PlayerInfo[];

    selectedCards: Card[];
}

const createEmptyState = (): SingleplayerState => ({
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

    cpuCount: 1,
    cpuDifficulty: "normal",

    players: [],

    selectedCards: [],
});

function engineInitializeGame(
    cpuCount: number,
    cpuDifficulty: "easy" | "normal" | "hard"
): SingleplayerState {
    const human: PlayerInfo = {
        id: "player-0",
        username: "You",
        avatarUrl: null,
        ready: true,
    };

    const cpuPlayers: PlayerInfo[] = Array.from({ length: cpuCount }).map(
        (_, i) => ({
            id: `cpu-${i + 1}`,
            username: `CPU ${i + 1}`,
            avatarUrl: null,
            ready: true,
        })
    );

    const players = [human, ...cpuPlayers];

    const deck = shuffleDeck(createDeck());
    const dealtHands = dealHands(deck, players.length).map(sortHand);

    let startingPlayer = 0;
    for (let i = 0; i < dealtHands.length; i++) {
        if (dealtHands[i].some(c => c.rank === 3 && c.suit === "clubs")) {
            startingPlayer = i;
            break;
        }
    }

    return {
        ...createEmptyState(),
        phase: "playing",
        cpuCount,
        cpuDifficulty,
        players,
        hands: dealtHands,
        deck,
        currentPlayerIndex: startingPlayer,
    };
}

function enginePlayCards(state: SingleplayerState, cards: Card[]): SingleplayerState {
    const playerIndex = state.currentPlayerIndex;

    if (state.phase !== "playing") return state;
    if (state.winner !== null) return state;

    const hand = state.hands[playerIndex];

    if (state.isNewRound && state.lastCombo === null) {
        const hasThreeClubs = hand.some(c => c.rank === 3 && c.suit === "clubs");
        if (hasThreeClubs) {
            const includesThreeClubs = cards.some(
                c => c.rank === 3 && c.suit === "clubs"
            );
            if (!includesThreeClubs) return state;
        }
    }

    const combo = detectCombo(cards);
    if (!combo) return state;

    if (state.lastCombo) {
        const cmp = compareCombos(combo, state.lastCombo);
        if (combo.type !== state.lastCombo.type || cmp <= 0) return state;
    }

    const newHands = state.hands.map((hand, i) =>
        i === playerIndex
            ? hand.filter(c => !cards.some(x => x.id === c.id))
            : hand
    );

    const playerWon = newHands[playerIndex].length === 0;
    const nextPlayer = (playerIndex + 1) % newHands.length;

    return {
        ...state,
        hands: newHands,
        lastCombo: combo,
        isNewRound: false,
        passesInRow: 0,
        currentPlayerIndex: nextPlayer,
        winner: playerWon ? playerIndex : null,
    };
}

function enginePassTurn(state: SingleplayerState): SingleplayerState {
    const playerIndex = state.currentPlayerIndex;

    if (state.phase !== "playing") return state;
    if (state.winner !== null) return state;

    const totalPlayers = state.hands.length;
    const nextPlayer = (playerIndex + 1) % totalPlayers;
    const newPassCount = state.passesInRow + 1;

    if (newPassCount >= totalPlayers - 1) {
        return {
            ...state,
            currentPlayerIndex: nextPlayer,
            passesInRow: 0,
            lastCombo: null,
            isNewRound: true,
        };
    }

    return {
        ...state,
        currentPlayerIndex: nextPlayer,
        passesInRow: newPassCount,
    };
}

function engineCpuTakeTurn(state: SingleplayerState): SingleplayerState {
    const playerIndex = state.currentPlayerIndex;
    const player = state.players[playerIndex];

    if (!player.id.startsWith("cpu-")) return state;

    const hand = state.hands[playerIndex];

    if (state.isNewRound && state.lastCombo === null) {
        const threeClubs = hand.find(c => c.rank === 3 && c.suit === "clubs");
        if (threeClubs) {
            return enginePlayCards(state, [threeClubs]);
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
        return enginePlayCards(state, chosen.cards);
    }

    return enginePassTurn(state);
}

export const useSingleplayerStore = create<{
    state: SingleplayerState;

    // GLOBAL DEFAULT SETTINGS (used by SettingsMenu)
    cpuCount: number;
    cpuDifficulty: "easy" | "normal" | "hard";

    setCpuCount: (n: number) => void;
    setCpuDifficulty: (d: "easy" | "normal" | "hard") => void;

    startGame: (cpuCount: number, difficulty: "easy" | "normal" | "hard") => void;
    playCards: (cards: Card[]) => void;
    passTurn: () => void;
    cpuTurn: () => void;

    selectedCards: Card[];
    toggleCardSelection: (card: Card) => void;
    clearSelection: () => void;
}>(set => ({
    state: createEmptyState(),

    // --- GLOBAL DEFAULTS ---
    cpuCount: 1,
    cpuDifficulty: "normal",

    setCpuCount: (n) => set({ cpuCount: n }),
    setCpuDifficulty: (d) => set({ cpuDifficulty: d }),

    // --- GAME ACTIONS ---
    startGame: (cpuCount, difficulty) =>
        set({ state: engineInitializeGame(cpuCount, difficulty) }),

    playCards: cards =>
        set(s => ({ state: enginePlayCards(s.state, cards) })),

    passTurn: () =>
        set(s => ({ state: enginePassTurn(s.state) })),

    cpuTurn: () =>
        set(s => ({ state: engineCpuTakeTurn(s.state) })),

    // --- CARD SELECTION ---
    selectedCards: [],
    toggleCardSelection: card =>
        set(s => {
            const exists = s.selectedCards.some(c => c.id === card.id);
            return {
                selectedCards: exists
                    ? s.selectedCards.filter(c => c.id !== card.id)
                    : [...s.selectedCards, card],
            };
        }),

    clearSelection: () => set({ selectedCards: [] }),
}));