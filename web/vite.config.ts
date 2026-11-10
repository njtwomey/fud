import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

const root = path.resolve(import.meta.dirname, '..')

export default defineConfig(({ mode }) => {
  // The single .env lives at the repository root. Only VITE_-prefixed keys reach the browser.
  const env = loadEnv(mode, root, '')
  return {
    envDir: root,
    // Set VITE_BASE=/repo-name/ when deploying to GitHub Pages under a project path.
    base: env.VITE_BASE || '/',
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
    // Port 0 lets the OS pick a free port, so dev never collides with another project on 5173.
    // Set WEB_PORT in .env to pin one.
    server: { port: env.WEB_PORT ? Number(env.WEB_PORT) : 0 },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test-setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
    },
  }
})
