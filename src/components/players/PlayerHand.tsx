import type { Card as CardType } from "../../game-engine/types";
import Card from "../cards/Card";

export function PlayerHand({
    hand,
    selected,
    toggleCard,
    isActive
}: {
    hand: CardType[];
    selected: Set<string>;
    toggleCard: (card: CardType) => void;
    isActive?: boolean
}) {

    // Wider arc for visibility 
    const maxAngle = 85;
    const angleStep = hand.length > 1 ? (maxAngle * 2) / (hand.length - 1) : 0;

    return (
        <div
            className={`
                relative h-48 w-[95vw] max-w-[800px] mx-auto
                scale-[0.9] md:scale-100
                transition-all
                ${isActive ? "scale-105 drop-shadow-[0_0_16px_var(--theme-accent)]" : ""}
            `}
        >
            {hand.map((card, i) => {
                const angle = -maxAngle + i * angleStep;

                return (
                    <div
                        key={card.id}
                        className="absolute bottom-0 transition-transform origin-bottom -translate-x-1/2 left-1/2"
                        style={{
                            transform: `translateX(-50%) rotate(${angle}deg)`,
                        }}
                        onClick={() => toggleCard(card)}
                    >
                        <Card
                            key={card.id}
                            card={card}
                            selected={selected.has(card.id)}
                            onClick={() => toggleCard(card)}
                        />
                    </div>
                );
            })}
        </div>
    );
}