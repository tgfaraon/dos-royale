import { useThemeStore } from "../../stores/themeStore";
import { useAudioStore } from "../../stores/audioStore";
import { useSingleplayerStore } from "../../stores/singleplayerGameStore";
import type { ThemeName } from "../../stores/themeStore";

export default function SettingsMenu({ onBack }: { onBack: () => void }) {
    const { theme, setTheme } = useThemeStore();

    const {
        cpuCount,
        setCpuCount,
        cpuDifficulty,
        setCpuDifficulty,
    } = useSingleplayerStore();

    const {
        bgmMuted,
        toggleBgmMuted,
        bgmVolume,
        setBgmVolume,
        muted,
        toggleMute,
        volume,
        setVolume,
    } = useAudioStore();

    return (
        <div
            className=" 
                relative flex flex-col items-center justify-center
                w-full h-screen text-[var(--theme-text)] overflow-hidden
            "
            style={{
                background: ` 
                    radial-gradient( 
                        circle at center, 
                        rgba(255,255,255,0.08) 0%, 
                        rgba(0,0,0,0.4) 60%
                    ),
                    var(--theme-bg) 
                `
            }}
        >
            {/* Felt */}
            <div className="absolute inset-0 opacity-[0.15] bg-[url('/felt.png')] bg-cover pointer-events-none"></div>

            {/* Spotlight */}
            <div
                className="absolute inset-0"
                style={{
                    background: ` 
                        radial-gradient( 
                            circle at 50% 20%, 
                            rgba(255,255,255,0.12) 0%, 
                            rgba(0,0,0,0.75) 60% 
                        ) 
                    `
                }}
            />

            {/* Vignette */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: ` 
                        radial-gradient( 
                            circle at center, 
                            rgba(0,0,0,0) 55%, 
                            rgba(0,0,0,0.35) 100% 
                        ) 
                    `
                }}
            />

            {/* Header */}
            <div className="relative mb-8">
                <div className="absolute inset-0 blur-[30px] opacity-20 bg-[var(--theme-accent)]"></div>
                <h2 className="relative text-4xl font-extrabold tracking-widest text-[var(--theme-accent)] drop-shadow-[0_0_10px_rgba(0,0,0,0.6)]">
                    PUBLIC MATCH
                </h2>
            </div>

            {/* Floating Card */}
            <div
                className=" 
                    relative z-10 flex flex-col items-center gap-6
                    bg-[var(--theme-surface)]/40 backdrop-blur-md
                    border border-[var(--theme-accent)]/40
                    rounded-xl px-8 py-6 shadow-[0_0_20px_rgba(0,0,0,0.4)]
                "
            >

                {/* HEADER */}
                <h2 className="text-3xl font-bold text-center text-[var(--theme-accent)] drop-shadow-md tracking-wide">
                    Settings
                </h2>

                {/* THEME */}
                <section className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-[var(--theme-accent)] drop-shadow-sm">
                        Theme
                    </h3>
                    <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as ThemeName)}
                        className=" 
                            w-full p-3 rounded-lg
                            bg-[var(--theme-surface)]
                            border border-[var(--theme-accent)]
                            text-[var(--theme-text)]
                            shadow-inner
                        "
                    >
                        <option value="vegas">Modern Vegas</option>
                        <option value="atlantic">Atlantic City</option>
                        <option value="highroller">High Roller</option>
                        <option value="homegame">Home Game</option>
                    </select>
                </section>

                {/* CPU DIFFICULTY */}
                <section className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-[var(--theme-accent)] drop-shadow-sm">
                        CPU Difficulty
                    </h3>

                    <div className="flex gap-3">
                        {(["easy", "normal", "hard"] as const).map((level) => (
                            <button
                                key={level}
                                onClick={() => setCpuDifficulty(level)}
                                className={` 
                                    flex-1 px-3 py-2 rounded-lg font-semibold capitalize
                                    border border-[var(--theme-accent)]
                                    shadow-[0_0_8px_rgba(0,0,0,0.4)]
                                    transition-all
                                    ${cpuDifficulty === level
                                        ? "bg-[var(--theme-accent)] text-black"
                                        : "bg-[var(--theme-surface)] text-[var(--theme-text)] opacity-80 hover:opacity-100"
                                    } 
                                `}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs opacity-60">
                        Difficulty changes apply when starting a new game.
                    </p>
                </section>

                {/* CPU OPPONENTS */}
                <section className="flex flex-col gap-2">
                    <h3 className="text-lg font-semibold text-[var(--theme-accent)] drop-shadow-sm">
                        CPU Opponents
                    </h3>

                    <select
                        value={cpuCount}
                        onChange={(e) => setCpuCount(Number(e.target.value))}
                        className=" 
                            w-full p-3 rounded-lg
                            bg-[var(--theme-surface)]
                            border border-[var(--theme-accent)]
                            text-[var(--theme-text)] shadow-inner
                        "
                    >
                        <option value={1}>1 CPU</option>
                        <option value={2}>2 CPUs</option>
                        <option value={3}>3 CPUs</option>
                    </select>
                </section>

                {/* AUDIO */}
                <section className="flex flex-col gap-4">
                    <h3 className="text-xl font-bold text-[var(--theme-accent)] drop-shadow-sm">
                        Audio
                    </h3>

                    {/* BGM */}
                    <div className="flex flex-col gap-2">
                        <h4 className="text-sm opacity-80">Background Music</h4>

                        <button
                            onClick={toggleBgmMuted}
                            className=" 
                                w-full px-3 py-2 rounded-lg
                                bg-[var(--theme-surface)] text-[var(--theme-text)]
                                border border-[var(--theme-accent)]
                                shadow-[0_0_8px_rgba(0,0,0,0.4)]
                                opacity-80 hover:opacity-100 transition-all
                            "
                        >
                            {bgmMuted ? "Unmute BGM" : "Mute BGM"}
                        </button>

                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={bgmVolume}
                            onChange={(e) => setBgmVolume(Number(e.target.value))}
                            className="w-full accent-[var(--theme-accent)] mt-1"
                        />
                    </div>

                    {/* SFX */}
                    <div className="flex flex-col gap-2">
                        <h4 className="text-sm opacity-80">Sound Effects</h4>

                        <button
                            onClick={toggleMute}
                            className=" 
                                w-full px-3 py-2 rounded-lg
                                bg-[var(--theme-surface)] text-[var(--theme-text)]
                                border border-[var(--theme-accent)]
                                shadow-[0_0_8px_rgba(0,0,0,0.4)]
                                opacity-80 hover:opacity-100 transition-all
                            "
                        >
                            {muted ? "Unmute SFX" : "Mute SFX"}
                        </button>

                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="w-full accent-[var(--theme-accent)] mt-1"
                        />
                    </div>
                </section>

                {/* BACK BUTTON */}
                <button
                    onClick={onBack}
                    className=" 
                        w-full py-3 rounded-lg
                        bg-[var(--theme-accent)] text-black
                        font-semibold text-lg tracking-wide
                        shadow-[0_0_12px_rgba(0,0,0,0.5)]
                        hover:brightness-110 transition-all
                    "
                >
                    Back
                </button>
            </div>
        </div>
    );
}