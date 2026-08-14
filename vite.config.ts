import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import type { Plugin, ViteDevServer } from 'vite'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import type { IncomingMessage, ServerResponse } from 'http'

const BACKEND_URL = 'https://alterlit.ru'

const reroutePlugin: Plugin = {
  name: 'reroute-plugin',
  configureServer(server: ViteDevServer) {
    server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: (err?: Error) => void) => {
      const url = req.url
      if (url && (/^\/preorder\/[^/]+\/?$/.test(url) || url === "/orders" || /^\/orders\//.test(url) || url === "/pay/success" || /^\/pay\/success\//.test(url) || url === "/pay/fail" || /^\/pay\/fail\//.test(url))) {
        const template = await server.transformIndexHtml(url, readFileSync(join(__dirname, 'index.html'), 'utf-8'))
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
