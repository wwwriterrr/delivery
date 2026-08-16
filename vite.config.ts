import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin, ViteDevServer } from 'vite'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { IncomingMessage, ServerResponse } from 'http'
import { isAppRoute } from './src/routes/paths.ts'

const BACKEND_URL = 'https://alterlit.ru'

const BASE = '/assets/cdek/'

/** Where `npm run dev` should drop you, since the base URL belongs to Django. */
const DEV_LANDING = '/orders/'

const reroutePlugin: Plugin = {
  name: 'reroute-plugin',
  configureServer(server: ViteDevServer) {
    server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void) => {
      const pathname = req.url?.split(/[?#]/)[0]

      // `/assets/cdek/` is Django's static prefix, not an app route. Vite
      // redirects `/` here on its own, which otherwise lands the developer on
      // the SPA's 404 at a URL the SPA does not own.
      if (pathname === BASE || pathname === BASE.slice(0, -1)) {
        res.statusCode = 302
        res.setHeader('Location', DEV_LANDING)
        res.end()
        return
      }

      // Route table lives in src/routes/paths.ts so it cannot drift from the router.
      if (req.url && isAppRoute(req.url)) {
        const template = await server.transformIndexHtml(req.url, readFileSync(join(import.meta.dirname, 'index.html'), 'utf-8'))
        res.setHeader('Content-Type', 'text/html')
        res.end(template)
        return
      }
      next()
    })
  },
  writeBundle(_options: unknown, _bundle: unknown) {
    const dist = 'dist'
    const src = join(dist, 'index.html')
    const dest = join(dist, 'preorder', '[slug]', 'index.html')

    mkdirSync(join(dist, 'preorder', '[slug]'), { recursive: true })
    writeFileSync(dest, readFileSync(src, 'utf-8'))
  },
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const sessionId = env.VITE_ALTERLIT_SESSION_ID
  const csrfToken = env.VITE_CSRF_TOKEN

  return {
    plugins: [react(), reroutePlugin],
    base: '/assets/cdek/',
    server: {
      port: Number(process.env.PORT) || 5173,
      proxy: {
        '/api': {
          target: BACKEND_URL,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
          let cookies: string[] = [];
          if (sessionId) cookies.push(`alterlitsessionid=${sessionId}`);
          if (csrfToken) cookies.push(`csrftoken=${csrfToken}`);
          if (cookies.length) {
            proxyReq.setHeader('Cookie', cookies.join('; '));
          }
          if (csrfToken && req.method && req.method !== 'GET') {
            proxyReq.setHeader('X-CSRFTOKEN', csrfToken);
          }
            })
          },
        },
      },
    },
  }
})
