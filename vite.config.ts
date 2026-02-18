import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Serve public/<dir>/index.html when /<dir>/ or /<dir> is requested
const staticDirIndex: Plugin = {
  name: 'static-dir-index',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      let url = req.url ?? '/'
      // Strip query string
      const qIdx = url.indexOf('?')
      if (qIdx !== -1) url = url.slice(0, qIdx)
      // Normalise to trailing-slash form for lookup
      const normalised = url.endsWith('/') ? url : url + '/'
      if (normalised !== '/') {
        const candidate = resolve(__dirname, 'public', normalised.slice(1), 'index.html')
        if (existsSync(candidate)) {
          const html = readFileSync(candidate, 'utf-8')
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(html)
          return
        }
      }
      next()
    })
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), staticDirIndex],
})
