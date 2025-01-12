import type { UnpluginFactory } from 'unplugin'
import { ensureLanguage, getLanguage } from '@vue.ts/language'
import { MagicString } from '@vue/compiler-sfc'
import { createUnplugin } from 'unplugin'
import type { Options } from './core/types'
import VueTsAutoPropsTransformClass from './core/transform'
import { genStringFromResolvedComponentsMap } from './core/utils'

export * from './core/transform'
export const VueTsAutoPropsTransform = VueTsAutoPropsTransformClass

export const unpluginFactory: UnpluginFactory<Options | undefined> = (options: Options | undefined) => ({
  name: 'vue-ts-auto-props',
  buildStart() {
    ensureLanguage(options?.tsConfigPath ?? './tsconfig.json')
  },
  transformInclude(id: string) {
    return id.endsWith('.ts') || id.endsWith('.tsx')
  },
  transform(code: string, file: string) {
    const s = new MagicString(code)
    const lang = getLanguage()
    const checker = lang.__internal__.typeChecker
    const ast = lang.getVirtualFileAst(file)

    // iterate over all statements in the file and find defineComponent
    if (ast) {
      const transform = new VueTsAutoPropsTransform(checker, options?.hideWarnings ?? false)
      const autoCodes = transform.resolveComponents(ast.statements)
      s.append(genStringFromResolvedComponentsMap(autoCodes))
    }

    return s.toString()
  },
})

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export default unplugin
