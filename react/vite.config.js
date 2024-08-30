import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import viteCompression from 'vite-plugin-compression'
import reactRefresh from '@vitejs/plugin-react-refresh'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  build: { manifest: true },
  base: process.env.mode === 'production' ? '/static/' : '/',
  root: './',
  server: {
    port: 3000,
    strictPort: true
  },
  preview: {
    port: 8081
  },
  plugins: [
    reactRefresh(),
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

// https://vitejs.dev/config/
// export default defineConfig({
//   build: { manifest: true },
//   base: process.env.mode === 'production' ? '/static/' : '/',
//   root: './react-app',
//   plugins: [
//     reactRefresh(),
//     viteCompression(),
//     VitePWA({
//       workbox: {
//         inlineWorkboxRuntime: true,
//         navigateFallbackDenylist: [/^\/admin/, /^\/api/],
//         modifyURLPrefix: {
//           assets: 'static/assets'
//         }
//       }
//     })
//   ]
// })
