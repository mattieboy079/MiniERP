import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Aspire injects the port to listen on via the PORT environment variable.
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5173,
  },
})
