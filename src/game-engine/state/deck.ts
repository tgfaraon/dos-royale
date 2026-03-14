import type { Card } from "../types";
import { Suit, Rank } from "../types";
import { v4 as uuid } from "uuid";
import { playSound } from "../../lib/playSound";

// Create a full 52‑card deck 
export function createDeck(): Card[] {
    const deck: Card[] = [];

    const suits = Object.values(Suit);
    const ranks = Object.values(Rank).filter((r) => typeof r === "number") as Rank[];

    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({
                suit,
                rank,
                id: uuid(),
            });
        }
    }

    return deck;
}

// Fisher–Yates shuffle (best practice) 
export function shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    } return shuffled;
}

// Deal 4 hands of 13 cards each 
export function dealHands(deck: Card[], totalPlayers: number): Card[][] {
    const hands: Card[][] = Array.from({ length: totalPlayers }, () => []);

    let deckIndex = 0;

    while (deckIndex < deck.length) {
        for (let p = 0; p < totalPlayers; p++) {
            if (deckIndex >= deck.length) break;
            hands[p].push(deck[deckIndex]);
            deckIndex++;
        }

        playSound("card-slide");

    }

    return hands;
}

// Sort a hand by Pusoy Dos rules: rank → suit 
export function sortHand(hand: Card[]): Card[] {
    return [...hand].sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;

        // Suit order: Clubs < Diamonds < Hearts < Spades 
        const suitOrder = {
            [Suit.Clubs]: 1,
            [Suit.Diamonds]: 2,
            [Suit.Hearts]: 3,
            [Suit.Spades]: 4,
        };

        return suitOrder[a.suit] - suitOrder[b.suit];
    });
}