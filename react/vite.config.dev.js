import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import eslint from 'vite-plugin-eslint'
import tsconfigPaths from 'vite-tsconfig-paths'
import * as path from 'path'
import chokidar from 'chokidar'
import { exec } from 'child_process'

export default defineConfig({
  mode: 'development',
  plugins: [
    eslint(),
    react(),
    tsconfigPaths(),
    {
      name: 'watch-typescript',
      configureServer(server) {
        chokidar.watch('src/**/*.ts?(x)').on('change', (path) => {
          exec('tsc', (err, stdout, stderr) => {
            if (err) {
              console.error(`exec error: ${err}`)
              return
            }
            if (stderr) {
              console.error(`stderr: ${stderr}`)
            }
            if (stdout) {
              console.log(`stdout: ${stdout}`)
            }
            server.ws.send({
              type: 'full-reload',
              path
            })
          })
        })
      }
    }
  ],
  css: {
    devSourcemap: true
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/app-redesign.tsx'),
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
