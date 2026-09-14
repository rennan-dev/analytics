import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // porta própria para não conflitar com o myreel-web (5173)
    port: 5174,
  },
})
