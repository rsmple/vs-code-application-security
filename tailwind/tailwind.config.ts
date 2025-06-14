import type {Config} from 'tailwindcss'

import tailwindBase from 'eco-vue-js/tailwind-base'

import pluginDefault from './plugins/default'
import sizes from './theme/sizes'

export default {
  mode: 'jit',
  content: [
    './src/webview/**/*.{vue,ts}',
    ...tailwindBase.content,
  ],
  presets: [
    tailwindBase,
  ],
  plugins: [
    pluginDefault,
  ],
  theme: {
    extend: {
      ...sizes,
    },
  },
} satisfies Config
