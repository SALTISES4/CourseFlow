import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import eslint from 'vite-plugin-eslint'
import tsconfigPaths from 'vite-tsconfig-paths'
import * as path from 'path'

export default defineConfig({
  mode: 'development',
  plugins: [eslint(), react(), tsconfigPaths()],
  css: {
    devSourcemap: true
  },
  esbuild: {
    loader: 'jsx',
    include: /\.(js|jsx|ts|tsx)$/,
    exclude: [],
    target: 'es2020'
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'load-js-files-as-jsx',
          setup(build) {
            build.onLoad({ filter: /\.(js|ts|tsx)$/ }, async (args) => {
              return {
                loader: 'jsx',
                contents: await fs.readFile(args.path, 'utf8')
              }
            })
          }
        }
      ]
    }
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/app-redesign.js'),
      name: 'CourseFlowApp',
      fileName: (format) => `courseflow-app.${format}.js`
    },
    rollupOptions: {
      output: {
        // manualChunks: {}
        // dir : '~/plugin/assets/',
        // entryFileNames: `test.js`
        // chunkFileNames: `assets/index-chunk.js`,
        // assetFileNames: `assets/[name].[ext]`,
      }
    },
    outDir: '../course_flow/static/course_flow/js/react/dist',
    sourcemap: true,
    minify: false,
    watch: process.env.VITE_BUILD_WATCH
      ? {
          include: 'src/**'
        }
      : null
  }
})
