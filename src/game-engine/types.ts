export const Suit = {
    Clubs: "clubs",
    Diamonds: "diamonds",
    Hearts: "hearts",
    Spades: "spades",
} as const;

export type Suit = (typeof Suit)[keyof typeof Suit];

export const Rank = {
    Three: 3,
    Four: 4,
    Five: 5,
    Six: 6,
    Seven: 7,
    Eight: 8,
    Nine: 9,
    Ten: 10,
    Jack: 11,
    Queen: 12,
    King: 13,
    Ace: 14,
    Two: 15,
} as const;

export type Rank = (typeof Rank)[keyof typeof Rank];

export interface Card {
    suit: Suit;
    rank: Rank;
    id: string;
}

export type ComboType =
    | "single"
    | "pair"
    | "triple"
    | "five-card";

export interface Combo {
    type: ComboType;
    cards: Card[];
}

export interface PlayerHand {
    cards: Card[];
}

export interface GameState {
    currentTurn: number;
    lastCombo: Combo | null;
}

export function rankToLabel(rank: Rank): string {
    switch (rank) {
        case Rank.Jack: return "J";
        case Rank.Queen: return "Q";
        case Rank.King: return "K";
        case Rank.Ace: return "A";
        case Rank.Two: return "2";
        default: return rank.toString();
    }
}