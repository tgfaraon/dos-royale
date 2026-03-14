import type { Card, Combo } from "../types";
import { chooseEasy } from "./easy";
import { chooseNormal } from "./normal";
import { chooseHard } from "./hard";

export type CpuDifficulty = "easy" | "normal" | "hard";

export function chooseCpuPlay(
    difficulty: CpuDifficulty,
    hand: Card[],
    lastCombo: Combo | null
): Combo | null {
    switch (difficulty) {
        case "easy":
            return chooseEasy(hand, lastCombo);
        case "normal":
            return chooseNormal(hand, lastCombo);
        case "hard":
        default:
            return chooseHard(hand, lastCombo);
    }
}