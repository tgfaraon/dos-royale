import { create } from "zustand";
import type { Screen } from "../types/Screen";

interface UIState {
    showProfileModal: boolean;
    setShowProfileModal: (v: boolean) => void;

    showUsernameModal: boolean;
    setShowUsernameModal: (v: boolean) => void;

    screen: Screen;
    setScreen: (screen: Screen) => void;
}

export const useUIStore = create<UIState>((set) => ({
    showProfileModal: false,
    setShowProfileModal: (v) => set({ showProfileModal: v }),

    showUsernameModal: false,
    setShowUsernameModal: (v) => set({ showUsernameModal: v }),

    screen: "play",
    setScreen: (screen) => set({ screen }),
}));