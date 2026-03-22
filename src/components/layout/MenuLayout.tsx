import { useEffect } from "react";
import UserBar from "../ui/UserBar";
import ProfileModal from "../ui/ProfileModal";
import { UsernameModal } from "../ui/UsernameModal";
import { useUIStore } from "../../stores/uiStore";
import { useThemeStore } from "../../stores/themeStore";

export default function MenuLayout({
    children,
    hideUserBar = false
}: {
    children: React.ReactNode;
    hideUserBar?: boolean;
}) {
    const showProfileModal = useUIStore((s) => s.showProfileModal);
    const setShowProfileModal = useUIStore((s) => s.setShowProfileModal);

    const showUsernameModal = useUIStore((s) => s.showUsernameModal);
    const setShowUsernameModal = useUIStore((s) => s.setShowUsernameModal);

    const themeVars = useThemeStore((state) => state.themes[state.theme].vars);

    useEffect(() => {
        // Reserved for future menu-level effects
    }, []);

    return (
        <div className="relative w-full h-full" style={themeVars}>
            {!hideUserBar && <UserBar />}

            {children}

            {/* Profile Modal */}
            {showProfileModal && (
                <ProfileModal
                    onClose={() => setShowProfileModal(false)}
                    onChangeUsername={() => {
                        setShowProfileModal(false);
                        setShowUsernameModal(true);
                    }}
                />
            )}

            {/* Username Modal */}
            {showUsernameModal && (
                <UsernameModal onClose={() => setShowUsernameModal(false)} />
            )}
        </div>
    );
}