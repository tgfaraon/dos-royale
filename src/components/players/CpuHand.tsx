type CpuHandProps = {
    position: "top" | "left" | "right";
    count: number;
    isActive?: boolean;
};

export function CpuHand({ position, count, isActive }: CpuHandProps) {
    const maxAngle = 12;
    const cardsToShow = Math.min(count, 6);
    const angleStep =
        cardsToShow > 1 ? (maxAngle * 2) / (cardsToShow - 1) : 0;

    const baseRotation =
        position === "top" ? 0 : position === "left" ? -90 : 90;

    return (
        <div
            className={`
                flex flex-col items-center gap-1
                transition-all
                ${isActive ? "scale-105 drop-shadow-[0_0_12px_var(--theme-accent)]" : "opacity-90"}
            `}
        >
            {/* Fan of card backs */}
            <div
                className="relative w-24 h-16"
                style={{ transform: `rotate(${baseRotation}deg)` }}
            >
                {Array.from({ length: cardsToShow }).map((_, i) => {
                    const angle = -maxAngle + i * angleStep;
                    return (
                        <div
                            key={i}
                            className="
                                absolute w-8 h-12
                                rounded-md
                                border border-[var(--theme-accent)]
                                bg-[var(--theme-surface)]
                                shadow-[0_0_6px_rgba(0,0,0,0.4)]
                                top-1/2 left-1/2
                            "
                            style={{
                                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                            }}
                        />
                    );
                })}
            </div>

            {/* Label below fan (always readable) */}
            <div className={`
                    text-sm font-semibold px-2 py-0.5 rounded
                    bg-[var(--theme-surface)]
                    text-[var(--theme-text)]
                    border border-[var(--theme-accent)]
                    shadow-[0_0_6px_rgba(0,0,0,0.4)]
                    ${isActive ? "brightness-110" : "opacity-90"}
                `}
            >
                {count} cards
            </div>
        </div>
    );
}