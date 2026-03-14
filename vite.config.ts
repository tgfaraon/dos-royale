import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: "/dosroyale/",
  plugins: [react()],
  publicDir: "public"
})