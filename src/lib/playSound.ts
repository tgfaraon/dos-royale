import { useAudioStore } from "../stores/audioStore";

export function playSound(name: string) {
    const { volume, muted } = useAudioStore.getState();
    if (muted) return;

    const audio = new Audio(`/dosroyale/sounds/${name}.mp3`);
    audio.volume = volume;
    audio.play().catch(() => { });
}