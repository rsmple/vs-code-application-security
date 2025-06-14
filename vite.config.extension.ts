import {defineConfig} from 'vite'

import {URL, fileURLToPath} from 'url'

import {pluginPackage} from './build/pluginPackage'

export default defineConfig({
  plugins: [pluginPackage],
  build: {
    lib: {
      entry: 'src/extension.ts',
      formats: ['cjs'],
      fileName: 'extension',
    },
    rollupOptions: {
      external: ['vscode', 'util', 'path', 'fs', 'child_process'],
    },
    outDir: 'extension',
    sourcemap: true,
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