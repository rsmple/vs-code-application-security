import plugin from 'eco-vue-js/eslint/plugin'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,js,mts,tsx,vue,json}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/node_modules/**', './extension/**'],
  },

  ...plugin.configs.recommended({
    tsConfig: [
      './tsconfig.json',
      './tsconfig.extension.json',
      './tsconfig.webview.json',
      './tsconfig.node.json',
    ],
  }),

  {
    files: ['./.vscode/**/*.json'],
    rules: {
      'jsonc/no-comments': 'off',
    },
  },
]
