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
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/app-redesign.jsx'),
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
