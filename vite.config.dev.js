import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import eslint from 'vite-plugin-eslint'
import tsconfigPaths from 'vite-tsconfig-paths'
import * as path from 'path'

export default defineConfig({
  css: {
    devSourcemap: true // this one
  },
  plugins: [eslint(), react(), tsconfigPaths()],
  mode: 'development',
  esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'load-js-files-as-jsx',
          setup(build) {
            build.onLoad({ filter: /src\/.*\.js$/ }, async (args) => {
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
      entry: path.resolve(
        __dirname,
        'course_flow/static/course_flow/js/react/src/app-redesign.js'
      ),
      name: 'MyLib',
      fileName: (format) => `my-lib.${format}.js`
    },
    rollupOptions: {
      output: {
        manualChunks: {}
        // dir : '~/plugin/assets/',
        // entryFileNames: `test.js`
        // chunkFileNames: `assets/index-chunk.js`,
        // assetFileNames: `assets/[name].[ext]`,
      }
    },
    outDir: './build',
    sourcemap: true,
    minify: false
  }
})
