import { useState, useEffect } from "react";
import { useThemeStore } from "./stores/themeStore";
import { useSingleplayerStore } from "./stores/singleplayerGameStore";
import { useMultiplayerStore } from "./stores/multiplayerGameStore";
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
import { LeaderboardPanel } from "./components/ui/LeaderboardPanel";

// LOGIN SYSTEM
import LoginModal from "./components/mainmenu/LoginModal";
import { useUserStore } from "./stores/userStore";
import { useInviteLink } from "./hooks/useInviteLink";

// USERNAME SYSTEM
import { UsernameModal } from "./components/ui/UsernameModal";
import { useUIStore } from "./stores/uiStore";

// GAMEPLAY
import { GameBoard } from "./components/game/GameBoard/GameBoard";
import LobbyFullScreen from "./components/lobby/LobbyFullScreen";

export default function App() {
  useUserStore.getState().hydrateUser();

  // -----------------------------
  // NAVIGATION STATE
  // -----------------------------
  const screen = useUIStore(s => s.screen);
  const setScreen = useUIStore(s => s.setScreen);

  const { bgmVolume, bgmMuted } = useAudioStore();

  // -----------------------------
  // AUDIO
  // -----------------------------
  useEffect(() => {
    audioManager.setBgmVolume(bgmVolume);
  }, [bgmVolume]);

  useEffect(() => {
    audioManager.setBgmVolume(bgmMuted ? 0 : bgmVolume);
  }, [bgmMuted, bgmVolume]);

  useEffect(() => {
    const id = setTimeout(() => {
      audioManager.playBgm();
    }, 300);
    return () => clearTimeout(id);
  }, []);

  // -----------------------------
  // LOGIN LOGIC
  // -----------------------------
  const isLoggedIn = useUserStore(s => s.isLoggedIn);
  const username = useUserStore(s => s.username);
  const provider = useUserStore(s => s.provider);
  const setShowUsernameModal = useUIStore(s => s.setShowUsernameModal);

  const showUsernameModal =
    isLoggedIn &&
    provider !== "guest" &&
    (!username || username === "Guest");

  // -----------------------------
  // THEME LOGIC
  // -----------------------------
  const theme = useThemeStore(state => state.theme);
  const themeVars = useThemeStore(state => state.themes[state.theme].vars);

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

  // Singleplayer state
  const cpuCount = useSingleplayerStore(s => s.state.cpuCount);
  const cpuDifficulty = useSingleplayerStore(s => s.state.cpuDifficulty);

  // Multiplayer state
  const lobbyId = useMultiplayerStore(s => s.state.lobbyId);

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

  // -----------------------------
  // USERNAME MODAL (GLOBAL)
  // -----------------------------
  const usernameModal = showUsernameModal ? (
    <UsernameModal onClose={() => setShowUsernameModal(false)} />
  ) : null;

  // -----------------------------
  // MAIN RENDER
  // -----------------------------
  return (
    <>
      {usernameModal}

      {screen === "game" ? (
        <GameBoard
          mode={mode}
          cpuCount={cpuCount}
          cpuDifficulty={cpuDifficulty}
          onNavigate={(next: Screen) => setScreen(next)}
          setScreen={setScreen}
        />
      ) : screen === "leaderboard" ? (
        <MenuLayout hideUserBar>
          <div style={themeVars} className="flex items-center justify-center w-full h-full">
            <LeaderboardPanel onBack={() => setScreen("play")} />
          </div>
        </MenuLayout>
      ) : (
        <MenuLayout>
          <div style={themeVars} className="w-full h-full">
            {!isLoggedIn && <LoginModal />}

            {screen === "menu" && <MainMenu onNavigate={setScreen} />}
            {screen === "settings" && <SettingsMenu onBack={() => setScreen("menu")} />}
            {screen === "howto" && <HowToPlay onNavigate={setScreen} />}
            {screen === "credits" && <Credits onNavigate={setScreen} />}
            {screen === "play" && <PlayMenu onNavigate={setScreen} setMode={setMode} />}

            {screen === "single" && (
              <SinglePlayerSetup
                onNavigate={setScreen}
                onStart={(count, difficulty) => {
                  setMode("single");
                  useSingleplayerStore.getState().startGame(count, difficulty);
                  setScreen("game");
                }}
              />
            )}

            {screen === "private" && lobbyId && (
              <PrivateMatchLobby
                onNavigate={(next: Screen) => {
                  if (next === "game") setMode("private");
                  setScreen(next);
                }}
              />
            )}

            {screen === "private" && !lobbyId && (
              <div className="flex items-center justify-center h-screen text-[var(--theme-text)]">
                <p>Loading lobby…</p>
              </div>
            )}

            {screen === "lobbyFull" && <LobbyFullScreen onNavigate={setScreen} />}
            {screen === "public" && <PublicMatchQueue onNavigate={setScreen} />}
          </div>
        </MenuLayout>
      )}
    </>
  );
}