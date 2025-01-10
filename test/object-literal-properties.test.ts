import { describe, expect, it } from 'vitest'
import { createTestProgramWithCode } from './utils'

describe('defineComponent object literal properties', () => {
  it('component with object literal as template arg', () => {
    const testCode = `
    import { defineComponent, h } from 'vue'
    
    export const MyCustomTSComponent = defineComponent<{
      title: string
      badge?: number
      subtitle?: number | string
      } & {
        messages?: string[]
        showIcon?: boolean
      }>((props) => () => h('div'))
    `
    const testFile = createTestProgramWithCode(testCode)

    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props.length).toBe(5)
  })

  it('component with object literal in arrow function prop', () => {
    const testCode = `
    import { defineComponent, h } from 'vue'
    
    export const MyCustomTSComponent = defineComponent((props: {
      title: string
      badge?: number
      subtitle?: number | string
      } & {
        messages?: string[]
        showIcon?: boolean
      }) => () => h('div'))
    `
    const testFile = createTestProgramWithCode(testCode)

    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props.length).toBe(5)
  })

  it('component with object literal in setup function', () => {
    const testCode = `
    import { defineComponent, h } from 'vue'
    
    export const MyCustomTSComponent = defineComponent({
      setup(props: {
        title: string
        badge?: number
        subtitle?: number | string
        } & {
          messages?: string[]
          showIcon?: boolean
        }) {
      }
    })
    `
    const testFile = createTestProgramWithCode(testCode)

    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props.length).toBe(5)
  })
})
