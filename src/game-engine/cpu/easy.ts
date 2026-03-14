import type { Card, Combo } from "../types";
import { findCombos } from "../rules/combos";
import { compareCombos } from "../rules/compare";

export function chooseEasy(
    hand: Card[],
    lastCombo: Combo | null
): Combo | null {
    const allCombos = findCombos(hand);
    if (!allCombos || allCombos.length === 0) return null;

    const validCombos =
        lastCombo === null
            ? allCombos
            : allCombos.filter((combo) => compareCombos(combo, lastCombo) > 0);

    if (validCombos.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * validCombos.length);
    return validCombos[randomIndex];
}