import type { Options } from './core/types'

import unplugin from '.'

export default (options: Options): any => ({
  name: 'vue-ts-auto-props',
  hooks: {
    'astro:config:setup': async (astro: any) => {
      astro.config.vite.plugins ||= []
      astro.config.vite.plugins.push(unplugin.vite(options))
    },
  },
})
