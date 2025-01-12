import { MagicString } from '@vue/compiler-sfc'
import type { VueResolvedMeta } from './transform'

export function genStringFromResolvedComponentsMap(autoCodes: Record<string, VueResolvedMeta>): string {
  const a = new MagicString('')
  Object.entries(autoCodes).forEach(([key, meta]) => {
    a.append(`
      if (${key}.props === undefined) {
        Object.defineProperty(${key}, 'props', {})
      }
      if (${key}.emits === undefined) {
        Object.defineProperty(${key}, 'emits', [])
      }
    `)
    meta.props.forEach((prop) => {
      a.append(`
      Object.defineProperty(${key}.props, \"${prop.name}\", {
          type: ${prop.type},
          required: ${prop.required},
      });
      `)
    })
    a.append(`
      ${key}.emits.push([${meta.events.map(event => `'${event.name}'`).join(',')}]);
    `)
  })
  return a.toString()
}
