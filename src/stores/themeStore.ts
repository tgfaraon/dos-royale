import { create } from "zustand";

export type ThemeName = "vegas" | "atlantic" | "highroller" | "homegame";

interface Theme {
    name: ThemeName;
    vars: Record<string, string>;
}

interface ThemeStore {
    theme: ThemeName;
    setTheme: (theme: ThemeName) => void;
    themes: Record<ThemeName, Theme>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
    theme: "vegas",

    setTheme: (theme) => set({ theme }),

    themes: {
        vegas: {
            name: "vegas",
            vars: {
                "--theme-text": "#ffffff",
                "--theme-accent": "#d4af37",
                "--theme-surface": "#0a5f5f",

                "--felt-color": "#0a5f5f",
                "--felt-highlight": "rgba(255,255,255,0.08)",
                "--felt-shadow": "rgba(0,0,0,0.45)",
                "--trim-color": "#d4af37",
                "--background-gradient":
                    "radial-gradient(circle at center, #0f6d6d, #063f3f 70%)",

                /* Rim */
                "--table-rim": "#3a1f1f", // deep burgundy leather 
                "--table-rim-highlight": "rgba(255,255,255,0.12)",
                "--rim-material": "#3a1f1f",
                "--rim-highlight": "rgba(255,255,255,0.18)",
                "--rim-shadow": "rgba(0,0,0,0.55)",
                "--rim-thickness": "22px",
                "--rim-radius": "999px",
                "--rim-specular": "rgba(255,255,255,0.22)",
                "--rim-texture": ` 
                    radial-gradient(circle at 30% 30%, rgba(255,255,255,0.04), transparent 60%),
                    repeating-linear-gradient(90deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 2px, transparent 2px, transparent 6px)
                   `,

                "--prop-chip": "#d4af37",
                "--prop-napkin": "#ffffff",
            },
        },

        atlantic: {
            name: "atlantic",
            vars: {
                "--theme-text": "#ffffff",
                "--theme-accent": "#b08d57",
                "--theme-surface": "#0d5a2a",

                "--felt-color": "#0d5a2a",
                "--felt-highlight": "rgba(255,255,255,0.06)",
                "--felt-shadow": "rgba(0,0,0,0.5)",
                "--trim-color": "#b08d57",
                "--background-gradient":
                    "radial-gradient(circle at center, #0f6b33, #06381d 70%)",

                /* Rim */
                "--table-rim": "#4b2e19", // mahogany 
                "--table-rim-highlight": "rgba(255,255,255,0.10)",
                "--rim-material": "#4b2e19",
                "--rim-highlight": "rgba(255,255,255,0.15)",
                "--rim-shadow": "rgba(0,0,0,0.65)",
                "--rim-thickness": "16px",
                "--rim-radius": "40px",
                "--rim-specular": "rgba(255,255,255,0.14)",
                "--rim-texture": ` 
                    linear-gradient(90deg, rgba(255,255,255,0.05), rgba(0,0,0,0.15)),
                    repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 3px, transparent 3px, transparent 8px)
                   `,

                "--prop-coin": "#c49a6c",
            },
        },

        highroller: {
            name: "highroller",
            vars: {
                "--theme-text": "#ffffff",
                "--theme-accent": "#c9a43b",
                "--theme-surface": "#111111",
                "--felt-color": "#111111",
                "--felt-highlight": "rgba(255,255,255,0.04)",
                "--felt-shadow": "rgba(0,0,0,0.7)",
                "--trim-color": "#c9a43b",
                "--background-gradient":
                    "radial-gradient(circle at center, #1a1a1a, #000000 70%)",

                /* Rim */
                "--table-rim": "#111111", // matte black leather 
                "--table-rim-highlight": "rgba(255,255,255,0.20)",
                "--rim-material": "#111111",
                "--rim-highlight": "rgba(255,255,255,0.25)",
                "--rim-shadow": "rgba(0,0,0,0.75)",
                "--rim-thickness": "26px",
                "--rim-radius": "999px",
                "--rim-specular": "rgba(255,255,255,0.28)",
                "--rim-texture": ` 
                    radial-gradient(circle at 40% 40%, rgba(255,255,255,0.06), transparent 70%),
                    repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 4px)
                   `,

                "--prop-goldchip": "#f5d76e",
            },
        },

        homegame: {
            name: "homegame",
            vars: {
                "--theme-text": "#ffffff",
                "--theme-accent": "#b22222",
                "--theme-surface": "#5a3b1e",

                "--wood-base": "#5a3b1e",
                "--wood-grain": "rgba(255,255,255,0.05)",
                "--wood-shadow": "rgba(0,0,0,0.4)",
                "--trim-color": "#b22222",
                "--background-gradient":
                    "radial-gradient(circle at center, #6b4226, #3a2414 70%)",

                /* Rim */
                "--table-rim": "#8b5a2b", // warm cheap wood 
                "--table-rim-highlight": "rgba(255,255,255,0.10)",
                "--rim-material": "#8b5a2b",
                "--rim-highlight": "rgba(255,255,255,0.12)",
                "--rim-shadow": "rgba(0,0,0,0.55)",
                "--rim-thickness": "12px",
                "--rim-radius": "20px",
                "--rim-specular": "rgba(255,255,255,0.10)",
                "--rim-texture": ` 
                    linear-gradient(90deg, rgba(255,255,255,0.05), rgba(0,0,0,0.15)),
                    repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 2px, transparent 2px, transparent 6px)
                   `,

                "--prop-pizzabox": "#d97a3a",
            },
        },
    },
}));