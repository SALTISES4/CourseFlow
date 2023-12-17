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
  build: {
    lib: {
      entry: path.resolve(__dirname, 'course_flow/static/course_flow/js/react/src/entry/scripts-redesign.jsx'),
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
    // outDir: './build',
    sourcemap: true,
    minify: false
  }
})
