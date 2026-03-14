import type { Card } from "../types";

export function renderRank(rank: number): string {
    switch (rank) {
        case 11: return "J";
        case 12: return "Q";
        case 13: return "K";
        case 14: return "A";
        case 15: return "2";
        default: return rank.toString();
    }
}

export function renderSuit(suit: string): string {
    switch (suit) {
        case "clubs": return "♣";
        case "diamonds": return "♦";
        case "hearts": return "♥";
        case "spades": return "♠";
        default: return suit;
    }
}

export function renderCard(card: Card): string {
    return `${renderRank(card.rank)}${renderSuit(card.suit)}`;
}