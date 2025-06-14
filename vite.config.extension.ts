import {defineConfig} from 'vite'

import {URL, fileURLToPath} from 'url'

import {pluginPackage} from './build/pluginPackage'

export default defineConfig({
  plugins: [pluginPackage],
  build: {
    lib: {
      entry: 'src/extension/extension.ts',
      formats: ['cjs'],
      fileName: 'extension',
    },
    rollupOptions: {
      external: ['vscode', 'util', 'path', 'fs', 'child_process'],
    },
    outDir: 'extension',
    sourcemap: false,
    minify: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@ext': fileURLToPath(new URL('./src/extension', import.meta.url)),
    },
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
})