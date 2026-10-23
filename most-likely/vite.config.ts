import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// One page, into dist/. `base: './'` because the game is served from a folder
// of its own — the fixtures server's /most-likely/, a studio's CDN — never from a
// site root.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // React Compiler auto-memoizes components/hooks app-wide (cuts re-render
    // cost with no per-component code). plugin-react v6 (Vite 8 / oxc) runs it
    // through @rolldown/plugin-babel + the exported preset, not a `babel`
    // option; the preset's filter only touches React/hook files, and React 19
    // ships the compiler runtime built-in. It bails out of anything it can't
    // safely optimize.
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      '@engine': path.resolve(import.meta.dirname, './engine'),
      '@shared': path.resolve(import.meta.dirname, './shared'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // One script, nothing loaded later: a frame on a shaky Wi-Fi has
    // everything once the page is in.
    modulePreload: false,
    rolldownOptions: { output: { codeSplitting: false } },
    // React, motion and the radix set in one script: ~550 kB, ~170 kB gzipped.
    chunkSizeWarningLimit: 800,
  },
})
