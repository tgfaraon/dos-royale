import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AudioState {
    // SFX 
    volume: number;
    setVolume: (v: number) => void;

    // BGM 
    bgmVolume: number;
    setBgmVolume: (v: number) => void;

    bgmEnabled: boolean;
    toggleBgm: () => void;

    bgmMuted: boolean;
    toggleBgmMuted: () => void;

    // Global mute 
    muted: boolean;
    toggleMute: () => void;
}

export const useAudioStore = create(
    persist<AudioState>((set) => ({
        volume: 0.8,
        muted: false,

        bgmVolume: 0.4,
        bgmEnabled: true,
        bgmMuted: false,

        toggleBgmMuted: () => set(s => ({ bgmMuted: !s.bgmMuted })),
        toggleBgm: () => set((s) => ({ bgmEnabled: !s.bgmEnabled })),

        setVolume: (v) => set({ volume: v }),
        toggleMute: () => set((s) => ({ muted: !s.muted })),

        setBgmVolume: (v) => set({ bgmVolume: v }),
    }),
        {
            name: "dosroyale-audio", // localStorage key 
        }
    )
);