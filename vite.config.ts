import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin, ViteDevServer } from 'vite'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { IncomingMessage, ServerResponse } from 'http'
import { isAppRoute } from './src/routes/paths.ts'

const BACKEND_URL = 'https://alterlit.ru'

/**
 * Where the built chunks, styles and fonts live — both on disk (`dist/<ASSETS_DIR>/`)
 * and in the URL (`/<ASSETS_DIR>/…`). Keeping `base` at the site root and moving
 * the prefix into `assetsDir` is what makes those two mirror each other, so a
 * request path can be mapped straight onto a file.
 */
const ASSETS_DIR = 'assets/books/preorder'

/** `/` belongs to Django in production; in dev it just drops you into the app. */
const DEV_LANDING = '/orders/'

const reroutePlugin: Plugin = {
  name: 'reroute-plugin',
  // Lets index.html point at files under public/ without repeating the prefix.
  transformIndexHtml(html: string) {
    return html.replaceAll('%ASSETS_DIR%', ASSETS_DIR)
  },
  configureServer(server: ViteDevServer) {
    server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void) => {
      const pathname = req.url?.split(/[?#]/)[0]

      // The site root is Django's, not an app route, so landing there would
      // show the SPA's own 404. In dev, send the developer into the app instead.
      if (pathname === '/') {
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
    base: '/',
    build: {
      assetsDir: ASSETS_DIR,
    },
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
