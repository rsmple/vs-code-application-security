import vue from '@vitejs/plugin-vue'
import {defineConfig} from 'vite'

import {resolve} from 'path'

export default defineConfig({
  root: resolve(__dirname, 'src/webview'),
  plugins: [vue()],
  build: {
    outDir: resolve(__dirname, 'extension/webview'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/webview/main.ts'),
    },
  },
})