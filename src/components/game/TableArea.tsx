import type { Card as CardType, Combo } from "../../game-engine/types";
import Card from "../cards/Card";

type TableAreaProps = { lastCombo: Combo | null; };

export function TableArea({ lastCombo }: TableAreaProps) {
    if (!lastCombo || !lastCombo.cards || lastCombo.cards.length === 0) {
        return (
            <div className="text-sm italic text-[var(--theme-text)] opacity-70">
                No cards played yet
            </div>
        );
    }

    return (
        <div className=" 
            flex flex-row justify-center items-center
            gap-2
            scale-[0.75]
            pointer-events-none 
        ">
            <div className="text-[var(--theme-accent)] font-semibold text-sm tracking-wide">
                {lastCombo.type}
            </div>

            <div className="flex flex-row justify-center items-center gap-2 scale-[0.75]">
                {lastCombo.cards.map((card: CardType) => (
                    <Card key={card.id} card={card} selected={false} />
                ))}
            </div>
        </div>
    );
}