import type { Card as CardType } from "../../game-engine/types";

export default function Card({
    card,
    selected,
    onClick
}: {
    card: CardType;
    selected?: boolean;
    onClick?: () => void;
}) {
    const isRed = card.suit === "hearts" || card.suit === "diamonds";
    const colorClass = isRed ? "text-red-600" : "text-black";

    const suitSymbols: Record<string, string> = {
        clubs: "♣",
        diamonds: "♦",
        hearts: "♥",
        spades: "♠",
    };

    const suitSymbol = suitSymbols[card.suit];

    const rankLabels: Record<number, string> = {
        11: "J",
        12: "Q",
        13: "K",
        14: "A",
        15: "2",
    };

    const rankLabel = rankLabels[card.rank] ?? card.rank.toString();

    return (
        <div
            onClick={onClick}
            className={` 
                relative
                w-16 h-24
                bg-white
                rounded-xl
                border border-gray-300
                shadow-md
                cursor-pointer
                transition-all duration-150
                hover:-translate-y-1
                hover:shadow-xl
                ${selected ? "ring-2 ring-yellow-400 -translate-y-2 shadow-2xl" : ""} 
                `}
        >
            {/* Top-left corner */}
            <div className={`absolute top-1 left-1 text-sm font-bold leading-tight ${colorClass}`}>
                {rankLabel}
                <div>{suitSymbol}</div>
            </div>

            {/* Center suit */}
            <div className={`absolute inset-0 flex items-center justify-center text-4xl ${colorClass}`}>
                {suitSymbol}
            </div>

            {/* Bottom-right corner (mirrored) */}
            <div className={`absolute bottom-1 right-1 text-sm font-bold leading-tight rotate-180 ${colorClass}`}
            >
                {rankLabel}
                <div>{suitSymbol}</div>
            </div>
        </div>
    );
}