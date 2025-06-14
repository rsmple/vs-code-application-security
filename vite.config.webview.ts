import vue from '@vitejs/plugin-vue'
import {defineConfig} from 'vite'

import {resolve} from 'path'
import {fileURLToPath} from 'url'

export default defineConfig({
  root: resolve(__dirname, 'src/webview'),
  plugins: [vue()],
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
})