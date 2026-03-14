import { useAudioStore } from "../stores/audioStore";

class AudioManager {
    private bgm: HTMLAudioElement | null = null;
    private readonly BGM_SRC = "/dosroyale/sounds/bgm.mp3";

    playBgm() {
        const { muted, bgmVolume } = useAudioStore.getState();

        // Create the BGM element only once 
        if (!this.bgm) {
            this.bgm = new Audio(this.BGM_SRC);
            this.bgm.loop = true;
        }

        // Always update volume immediately 
        this.bgm.volume = muted ? 0 : bgmVolume;

        // Only call play() if it's currently paused 
        if (this.bgm.paused) {
            this.bgm.play().catch(err => { console.log("BGM blocked:", err); });
        }
    }

    stopBgm() {
        if (this.bgm) {
            this.bgm.pause();
        }
    }

    setBgmVolume(v: number) {
        if (this.bgm) {
            this.bgm.volume = v;
        }
    }

    playSfx(src: string) {
        const { volume, muted } = useAudioStore.getState();
        const sfx = new Audio(src);
        sfx.volume = muted ? 0 : volume;
        sfx.play().catch(() => { });
    }
}

export const audioManager = new AudioManager();