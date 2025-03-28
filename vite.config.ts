import {defineConfig} from 'vite'

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
  define: {
    'process.env.NODE_ENV': '"production"',
  },
})