export function ActionBar({
    onPlay,
    onPass,
    disabled
}: {
    onPlay: () => void;
    onPass: () => void;
    disabled: boolean;
}) {

    return (
        <div className="flex justify-center gap-4 mt-4">
            <button
                onClick={onPlay}
                disabled={disabled}
                className="
                    px-4 py-2
                    rounded
                    font-semibold
                    bg-[var(--theme-accent)]
                    text-[var(--theme-text)]
                    shadow-[0_0_10px_rgba(0,0,0,0.4)]
                    hover:brightness-110
                    active:brightness-90
                    transition-all
                    disabled:opacity-40
                    disabled:cursor-not-allowed
                "
            >
                Play Selected
            </button>

            <button
                onClick={onPass}
                disabled={disabled}
                className="
                    px-4 py-2
                    rounded
                    font-semibold
                    bg-[var(--theme-accent)]
                    text-[var(--theme-text)]
                    shadow-[0_0_10px_rgba(0,0,0,0.4)]
                    hover:brightness-110
                    active:brightness-90
                    transition-all
                    disabled:opacity-40
                    disabled:cursor-not-allowed
                "
            >
                Pass
            </button>
        </div>
    );
}