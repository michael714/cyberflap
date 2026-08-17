import { copyFileSync, existsSync, readFileSync } from 'node:fs'
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

/** Dev-only: serve repo-root agenda.txt so local edits match the GitHub upload file. */
function serveRepoAgenda() {
  return {
    name: 'serve-repo-agenda',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0]
        if (path !== '/agenda.txt') {
          next()
          return
        }
        const file = resolve(import.meta.dirname, 'agenda.txt')
        if (!existsSync(file)) {
          res.statusCode = 404
          res.end('agenda.txt not found')
          return
        }
        res.setHeader('Content-Type', 'text/plain; charset=utf-8')
        res.setHeader('Cache-Control', 'no-store')
        res.end(readFileSync(file, 'utf8'))
      })
    },
  }
}

// Production lives at https://michael714.github.io/cyberflap/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/cyberflap/' : '/',
  plugins: [react(), githubPagesSpaFallback(), serveRepoAgenda()],
}))

