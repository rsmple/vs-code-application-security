import vue from '@vitejs/plugin-vue'
import autoprefixer from 'autoprefixer'
import postcssImport from 'postcss-import'
import tailwindcss from 'tailwindcss'
import {defineConfig} from 'vite'

import {resolve} from 'path'
import {fileURLToPath} from 'url'

export default defineConfig({
  root: resolve(__dirname, 'src/webview'),
  plugins: [vue()],
  css: {
    postcss: {
      plugins: [postcssImport(), tailwindcss({config: './tailwind/tailwind.config.ts'}), autoprefixer()],
    },
  },
  build: {
    outDir: resolve(__dirname, 'extension/webview'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/webview/main.ts'),
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@web': fileURLToPath(new URL('./src/webview', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, Content-Type, X-Auth-Token',
    },
  },
})