import { readFileSync } from 'node:fs'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
)

export default defineConfig({
  build: { manifest: true },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  },
  base: '/',
  server: {
    port: 3000,
    strictPort: true,
    allowedHosts: process.env.VITE_ALLOWED_HOSTS?.split(',').filter(Boolean)
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  preview: {
    port: 8081
  },
  plugins: [
    react(),
    tsconfigPaths(),
    viteCompression(),
    VitePWA({
      workbox: {
        inlineWorkboxRuntime: true,
        navigateFallbackDenylist: [/^\/admin/, /^\/api/],
        modifyURLPrefix: {
          assets: 'static/assets'
        }
      }
    })
  ]
})
