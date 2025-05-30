import plugin from 'eco-vue-js/eslint/plugin'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,js,mts,tsx,vue,json}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/node_modules/**', '**/extension/**'],
  },

  ...plugin.configs.recommended({noVue: true}),

  {
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.src.json',
        },
      },
    },
  },

  {
    files: ['./.vscode/**/*.json'],
    rules: {
      'jsonc/no-comments': 'off',
    },
  },
]
