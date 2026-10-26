import { readFileSync } from 'node:fs'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import viteCompression from 'vite-plugin-compression'
import { VitePWA } from 'vite-plugin-pwa'
import tsconfigPaths from 'vite-tsconfig-paths'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
)

const GTM_CONTAINER_ID_PATTERN = /^GTM-[A-Z0-9]+$/

function googleTagManager(containerId) {
  if (!containerId) {
    return null
  }

  if (!GTM_CONTAINER_ID_PATTERN.test(containerId)) {
    throw new Error(
      'VITE_GTM_CONTAINER_ID must be a valid Google Tag Manager web container ID (for example, GTM-ABCDEFG).'
    )
  }

  return {
    name: 'courseflow-google-tag-manager',
    transformIndexHtml() {
      return [
        {
          tag: 'script',
          children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`,
          injectTo: 'head-prepend'
        },
        {
          tag: 'noscript',
          children: `<iframe src="https://www.googletagmanager.com/ns.html?id=${containerId}"
height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
          injectTo: 'body-prepend'
        }
      ]
    }
  }
}

const baseConfig = {
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
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const gtmContainerId = (
    process.env.VITE_GTM_CONTAINER_ID ??
    env.VITE_GTM_CONTAINER_ID ??
    ''
  ).trim()

  if (command === 'build' && !gtmContainerId) {
    throw new Error('VITE_GTM_CONTAINER_ID is required for production builds.')
  }

  return {
    ...baseConfig,
    plugins: [googleTagManager(gtmContainerId), ...baseConfig.plugins].filter(
      Boolean
    )
  }
})
