import { useState, useEffect } from "react";
import { useThemeStore } from "./stores/themeStore";
import { useGameStore } from "./stores/gameStore";
import type { Screen } from "./types/Screen";

// MAIN MENU SYSTEM
import { MainMenu } from "./components/mainmenu/MainMenu";
import { PlayMenu } from "./components/mainmenu/PlayMenu";
import { SinglePlayerSetup } from "./components/mainmenu/SinglePlayerSetup";
import SettingsMenu from "./components/mainmenu/SettingsMenu";
import { HowToPlay } from "./components/mainmenu/HowToPlay";
import { Credits } from "./components/mainmenu/Credits";
import { useAudioStore } from "./stores/audioStore";
import { audioManager } from "./lib/audioManager";
import MenuLayout from "./components/layout/MenuLayout";
import PrivateMatchLobby from "./components/lobby/PrivateMatchLobby";
import PublicMatchQueue from "./components/lobby/PublicMatchQueue";

// LOGIN SYSTEM
import LoginModal from "./components/mainmenu/LoginModal";
import { useUserStore } from "./stores/userStore";
import { useInviteLink } from "./hooks/useInviteLink";

// GAMEPLAY
import { GameBoard } from "./components/layout/GameBoard";
import LobbyFullScreen from "./components/lobby/LobbyFullScreen";

export default function App() {
  // -----------------------------
  // NAVIGATION STATE
  // -----------------------------
  const [screen, setScreen] = useState<Screen>(() => {
    const saved = localStorage.getItem("dosroyale-screen");
    return (saved as Screen) || "menu";
  });

  const { bgmVolume, bgmMuted } = useAudioStore();

  // Save screen whenever it changes
  useEffect(() => {
    localStorage.setItem("dosroyale-screen", screen);
  }, [screen]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lobby = params.get("lobby");

    if (lobby) {
      useGameStore.getState().setLobbyId(lobby);
    }
  }, []);

  // Adjust volume
  useEffect(() => {
    audioManager.setBgmVolume(bgmVolume);
  }, [bgmVolume]);

  // Mute
  useEffect(() => {
    audioManager.setBgmVolume(bgmMuted ? 0 : bgmVolume);
  }, [bgmMuted, bgmVolume]);

  // Safe BGM initialization
  useEffect(() => {
    const id = setTimeout(() => {
      audioManager.playBgm();
    }, 300);

    return () => clearTimeout(id);
  }, []);

  // -----------------------------
  // LOGIN LOGIC
  // -----------------------------
  const isLoggedIn = useUserStore((s) => s.isLoggedIn);
  const provider = useUserStore((s) => s.provider);

  // -----------------------------
  // THEME LOGIC
  // -----------------------------
  const theme = useThemeStore((state) => state.theme);
  const themeVars = useThemeStore((state) => state.themes[state.theme].vars);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "vegas") {
      root.style.setProperty("--theme-bg", "#0A3D62");
      root.style.setProperty("--theme-accent", "#D4AF37");
      root.style.setProperty("--theme-surface", "#0D0D0D");
      root.style.setProperty("--theme-text", "#FFFFFF");
    }

    if (theme === "atlantic") {
      root.style.setProperty("--theme-bg", "#0B6623");
      root.style.setProperty("--theme-accent", "#C19A6B");
      root.style.setProperty("--theme-surface", "#1A1A1A");
      root.style.setProperty("--theme-text", "#FFFFFF");
    }

    if (theme === "highroller") {
      root.style.setProperty("--theme-bg", "#000000");
      root.style.setProperty("--theme-accent", "#E5C100");
      root.style.setProperty("--theme-surface", "#0A0A0A");
      root.style.setProperty("--theme-text", "#FFFFFF");
    }

    if (theme === "homegame") {
      root.style.setProperty("--theme-bg", "#8B4513");
      root.style.setProperty("--theme-accent", "#FF6347");
      root.style.setProperty("--theme-surface", "#5A2E0C");
      root.style.setProperty("--theme-text", "#FFF8E7");
    }
  }, [theme]);

  // -----------------------------
  // PLAY MODE
  // -----------------------------
  const [mode, setMode] = useState<"single" | "private" | "public" | null>(null);

  // NEW authoritative selectors
  const cpuCount = useGameStore((s) => s.gameState.cpuCount);
  const cpuDifficulty = useGameStore((s) => s.gameState.cpuDifficulty);
  const lobbyId = useGameStore((s) => s.gameState.lobbyId);

  function navigate(next: Screen) {
    setScreen(next);
  }

  useInviteLink(navigate);

  // -----------------------------
  // LOGIN GUARD FOR MULTIPLAYER
  // -----------------------------
  if (provider === "guest" && (screen === "private" || screen === "public")) {
    return (
      <MenuLayout>
        <div className="text-center text-[var(--theme-text)] p-8">
          <h2 className="mb-4 text-2xl font-bold">Login Required</h2>
          <p className="mb-6">Multiplayer requires an account. Please log in to continue.</p>
          <button
            onClick={() => useUserStore.getState().logout()}
            className="px-4 py-2 bg-[var(--theme-accent)] text-[var(--theme-text)] rounded-lg"
          >
            Open Login
          </button>
        </div>
      </MenuLayout>
    );
  }

  return (
    <MenuLayout>
      <div style={themeVars} className="w-full h-full">
        {!isLoggedIn && <LoginModal />}

        {/* MAIN MENU SYSTEM */}
        {screen === "menu" && (
          <MainMenu onNavigate={setScreen} />
        )}

        {screen === "settings" && (
          <SettingsMenu onBack={() => setScreen("menu")} />
        )}

        {screen === "howto" && (
          <HowToPlay onNavigate={setScreen} />
        )}

        {screen === "credits" && (
          <Credits onNavigate={setScreen} />
        )}

        {screen === "play" && (
          <PlayMenu onNavigate={setScreen} setMode={setMode} />
        )}

        {/* GAME MODE SETUP SCREENS */}
        {screen === "single" && (
          <SinglePlayerSetup
            onNavigate={setScreen}
            onStart={() => {
              setMode("single");

              useGameStore.getState().singleInitializeGame(
                useGameStore.getState().gameState.cpuCount,
                useGameStore.getState().gameState.cpuDifficulty
              );

              setScreen("game");
            }}
          />
        )}

        {screen === "private" && lobbyId && (
          <PrivateMatchLobby onNavigate={setScreen} />
        )}

        {screen === "privateLobby" && (
          <PrivateMatchLobby onNavigate={setScreen} />
        )}


        {screen === "private" && !lobbyId && (
          <div className="flex items-center justify-center h-screen text-[var(--theme-text)]">
            <p>Loading lobby…</p>
          </div>
        )}

        {screen === "lobbyFull" && (
          <LobbyFullScreen onNavigate={setScreen} />
        )}

        {screen === "public" && (
          <PublicMatchQueue onNavigate={setScreen} />
        )}

        {/* ACTUAL GAME */}
        {screen === "game" && (
          <GameBoard
            mode={mode}
            cpuCount={cpuCount}
            cpuDifficulty={cpuDifficulty}
            onNavigate={(next: Screen) => setScreen(next)}
            setScreen={setScreen}
          />
        )}
      </div>
    </MenuLayout>
  );
}
