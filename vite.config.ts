import {defineConfig} from 'vite'

import {URL, fileURLToPath} from 'url'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/extension.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      external: ['vscode', 'node-fetch', 'util', 'path', 'fs'],
    },
    outDir: 'dist',
    sourcemap: true,
    minify: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
})