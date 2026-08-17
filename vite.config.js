import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function githubPagesSpaFallback() {
  return {
    name: 'github-pages-spa-fallback',
    closeBundle() {
      const dist = resolve(import.meta.dirname, 'dist')
      copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
    },
  }
}

// Production lives at https://michael714.github.io/cyberflap/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/cyberflap/' : '/',
  plugins: [react(), githubPagesSpaFallback()],
}))

