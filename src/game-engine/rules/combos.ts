import type { Card, Combo } from "../types";
import { Rank } from "../types";
import { sortHand } from "../state/deck";

// ---------- Helpers ----------

// Count occurrences of each rank 
function countRanks(cards: Card[]): Record<number, number> {
    const counts: Record<number, number> = {};
    for (const card of cards) {
        counts[card.rank] = (counts[card.rank] || 0) + 1;
    }
    return counts;
}

// Check if all cards share the same suit 
function isFlush(cards: Card[]): boolean {
    const suit = cards[0].suit;
    return cards.every((c) => c.suit === suit);
}

// Check if ranks form a straight (3 → 2 order) 
function isStraight(cards: Card[]): boolean {
    const sorted = sortHand(cards);
    for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i + 1].rank - sorted[i].rank !== 1) {
            return false;
        }
    } return true;
}

// Check for Royal Flush (10, J, Q, K, A of same suit) 
function isRoyalFlush(cards: Card[]): boolean {
    if (!isFlush(cards)) return false;

    const ranks = cards.map((c) => c.rank).sort((a, b) => a - b);
    const royal = [
        Rank.Ten,
        Rank.Jack,
        Rank.Queen,
        Rank.King,
        Rank.Ace,
    ];

    return JSON.stringify(ranks) === JSON.stringify(royal);
}

// Check for Four of a Kind (4 + kicker) 
function isFourOfAKind(cards: Card[]): boolean {
    const counts = countRanks(cards);
    return Object.values(counts).includes(4);
}

// Check for Full House (3 + 2) 
function isFullHouse(cards: Card[]): boolean {
    const counts = countRanks(cards);
    const values = Object.values(counts);
    return values.includes(3) && values.includes(2);
}

// Check for Straight Flush (but not Royal Flush) 
function isStraightFlush(cards: Card[]): boolean {
    return isFlush(cards) && isStraight(cards) && !isRoyalFlush(cards);
}

// ---------- Main Combo Detection ---------- 
export function detectCombo(cards: Card[]): Combo | null {
    const count = cards.length;

    // Sort for consistent evaluation 
    const sorted = sortHand(cards);

    // ----- Single ----- 
    if (count === 1) {
        return { type: "single", cards: sorted };
    }

    // ----- Pair -----
    if (count === 2) {
        if (sorted[0].rank === sorted[1].rank) {
            return { type: "pair", cards: sorted };
        } return null;
    }

    // ----- Triple ----- 
    if (count === 3) {
        const r = sorted[0].rank;
        if (sorted.every((c) => c.rank === r)) {
            return { type: "triple", cards: sorted };
        } return null;
    }

    // ----- Five‑card combos ----- 
    if (count === 5) {
        if (isRoyalFlush(sorted)) {
            return { type: "five-card", cards: sorted };
        }
        if (isStraightFlush(sorted)) {
            return { type: "five-card", cards: sorted };
        }
        if (isFourOfAKind(sorted)) {
            return { type: "five-card", cards: sorted };
        }
        if (isFullHouse(sorted)) {
            return { type: "five-card", cards: sorted };
        }
        if (isFlush(sorted)) {
            return { type: "five-card", cards: sorted };
        }
        if (isStraight(sorted)) {
            return { type: "five-card", cards: sorted };
        }
        return null;
    }

    // Invalid combo size 
    return null;
}

// Generate ALL valid combos from a hand 
export function findCombos(hand: Card[]): Combo[] {
    const combos: Combo[] = [];

    // 1. Singles 
    hand.forEach((card) => {
        const c = detectCombo([card]); if (c) combos.push(c);
    });

    // 2. Pairs 
    for (let i = 0; i < hand.length; i++) {
        for (let j = i + 1; j < hand.length; j++) {
            const c = detectCombo([hand[i], hand[j]]);
            if (c) combos.push(c);
        }
    }

    // 3. Triples 
    for (let i = 0; i < hand.length; i++) {
        for (let j = i + 1; j < hand.length; j++) {
            for (let k = j + 1; k < hand.length; k++) {
                const c = detectCombo([hand[i], hand[j], hand[k]]);
                if (c) combos.push(c);
            }
        }
    }

    // 4. Five-card combos (straight, flush, full house, straight flush) 
    for (let a = 0; a < hand.length; a++) {
        for (let b = a + 1; b < hand.length; b++) {
            for (let c = b + 1; c < hand.length; c++) {
                for (let d = c + 1; d < hand.length; d++) {
                    for (let e = d + 1; e < hand.length; e++) {
                        const cards = [hand[a], hand[b], hand[c], hand[d], hand[e]];
                        const combo = detectCombo(cards);
                        if (combo) combos.push(combo);
                    }
                }
            }
        }
    }

    return combos;
}