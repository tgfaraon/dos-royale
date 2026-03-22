import type { Card, Combo } from "../types";
import { Suit, Rank } from "../types";
import { sortHand } from "../state/deck";

// ---------- Utility Helpers ----------

const suitStrength = {
    [Suit.Clubs]: 1,
    [Suit.Spades]: 2,
    [Suit.Hearts]: 3,
    [Suit.Diamonds]: 4,
};

// Compare two cards by rank → suit 
function compareCards(a: Card, b: Card): number {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return suitStrength[a.suit] - suitStrength[b.suit];
}

// Get the highest card in a sorted combo 
function highestCard(cards: Card[]): Card {
    const sorted = sortHand(cards);
    return sorted[sorted.length - 1];
}

// ---------- 5‑Card Combo Ranking ----------
// Higher number = stronger combo 
const fiveCardRank = {
    "straight": 1,
    "flush": 2,
    "full-house": 3,
    "four-of-a-kind": 4,
    "straight-flush": 5,
    "royal-flush": 6,
};

// Identify which 5‑card combo it is 
function classifyFiveCardCombo(cards: Card[]): keyof typeof fiveCardRank | null {
    const sorted = sortHand(cards);

    const ranks = sorted.map((c) => c.rank);
    const suits = sorted.map((c) => c.suit);

    const isFlush = suits.every((s) => s === suits[0]);

    const isStraight = ranks.every((r, i) => i === 0 ? true : r - ranks[i - 1] === 1);

    const counts: Record<number, number> = {};
    for (const r of ranks) counts[r] = (counts[r] || 0) + 1;

    const values = Object.values(counts);

    const isFour = values.includes(4);
    const isThree = values.includes(3);
    const isPair = values.includes(2);

    const isFullHouse = isThree && isPair;

    const isRoyal =
        isFlush &&
        JSON.stringify(ranks) ===
        JSON.stringify([Rank.Ten, Rank.Jack, Rank.Queen, Rank.King, Rank.Ace]);

    if (isRoyal) return "royal-flush";
    if (isFlush && isStraight) return "straight-flush";
    if (isFour) return "four-of-a-kind";
    if (isFullHouse) return "full-house";
    if (isFlush) return "flush";
    if (isStraight) return "straight";

    return null;
}

// ---------- Main Comparison Logic ---------- 

export function doesComboBeat(a: Combo, b: Combo): boolean {
    // Must be same combo type 
    if (a.type !== b.type) return false;

    // ----- Single ----- 
    if (a.type === "single") {
        return compareCards(highestCard(a.cards), highestCard(b.cards)) > 0;
    }

    // ----- Pair ----- 
    if (a.type === "pair") {
        const aRank = a.cards[0].rank;
        const bRank = b.cards[0].rank;

        if (aRank !== bRank) return aRank > bRank;

        // Tie‑break by highest suit 
        const aHigh = highestCard(a.cards);
        const bHigh = highestCard(b.cards);
        return suitStrength[aHigh.suit] > suitStrength[bHigh.suit];
    }

    // ----- Triple ----- 
    if (a.type === "triple") {
        const aRank = a.cards[0].rank;
        const bRank = b.cards[0].rank;
        return aRank > bRank;
    }

    // ----- Five‑card combos ----- 
    if (a.type === "five-card") {
        const aClass = classifyFiveCardCombo(a.cards);
        const bClass = classifyFiveCardCombo(b.cards);

        if (!aClass || !bClass) return false;

        // Compare combo category strength 
        if (fiveCardRank[aClass] !== fiveCardRank[bClass]) {
            return fiveCardRank[aClass] > fiveCardRank[bClass];
        }

        // Same category → compare highest card 
        const aHigh = highestCard(a.cards);
        const bHigh = highestCard(b.cards);

        return compareCards(aHigh, bHigh) > 0;
    }

    return false;
}

// Compare two combos: return 1 if A > B, -1 if A < B, 0 if equal 
export function compareCombos(a: Combo, b: Combo): number {
    // Must be same combo type 
    if (a.type !== b.type) return -1;

    // ----- Single ----- 
    if (a.type === "single") {
        return compareCards(highestCard(a.cards), highestCard(b.cards));
    }

    // ----- Pair ----- 
    if (a.type === "pair") {
        const aRank = a.cards[0].rank;
        const bRank = b.cards[0].rank;

        if (aRank !== bRank) {
            return aRank > bRank ? 1 : -1;
        }

        // Same rank → compare highest suit 
        const aHigh = highestCard(a.cards);
        const bHigh = highestCard(b.cards);

        const aSuit = suitStrength[aHigh.suit];
        const bSuit = suitStrength[bHigh.suit];

        if (aSuit === bSuit) return 0;
        return aSuit > bSuit ? 1 : -1;
    }

    // ----- Triple -----
    if (a.type === "triple") {
        const aRank = a.cards[0].rank;
        const bRank = b.cards[0].rank;
        return aRank > bRank ? 1 : -1;
    }

    // ----- Five-card ----- 
    if (a.type === "five-card") {
        const aClass = classifyFiveCardCombo(a.cards);
        const bClass = classifyFiveCardCombo(b.cards);

        // If either is invalid, cannot compare 
        if (!aClass || !bClass) return -1;

        // Compare category strength 
        if (fiveCardRank[aClass] !== fiveCardRank[bClass]) {
            return fiveCardRank[aClass] > fiveCardRank[bClass] ? 1 : -1;
        }

        // Same category → compare highest card 
        const aHigh = highestCard(a.cards);
        const bHigh = highestCard(b.cards);

        return compareCards(aHigh, bHigh);
    }

    return -1;
}