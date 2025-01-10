import { describe, expect, it } from 'vitest'
import { createTestProgramWithCode } from './utils'

describe('defineComponent statement search test:', () => {
  it('find a single defineComponent statement with template type.', () => {
    const testCode = `
    import { defineComponent, h } from 'vue'
    type MyCustomTSComponentProps = {
      title: string
    }
    export const MyCustomTSComponent = defineComponent<MyCustomTSComponentProps>((props) => h('div'))
    `
    const testFile = createTestProgramWithCode(testCode)

    expect(testFile?.statements?.length).toBe(3)
    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
  })

  it('find a multiple defineComponent statement with template type.', () => {
    const testCode = `
    import { defineComponent, h } from 'vue'
    type MyCustomTSComponentProps = {
      title: string
    }
    export const MyCustomTSComponent = defineComponent<MyCustomTSComponentProps>((props) => h('div'))
    export const MyCustomSecondComponent = defineComponent<MyCustomTSComponentProps>((props) => h('div'))
    `
    const testFile = createTestProgramWithCode(testCode)

    expect(testFile?.statements?.length).toBe(4)
    expect(Object.keys(testFile?.result ?? {}).length).toBe(2)
  })

  it('find a single defineComponent statement with arrow function args.', () => {
    const testCode = `
    import { defineComponent, h } from 'vue'
    type MyCustomTSComponentProps = {
      title: string
    }
    export const MyCustomTSComponent = defineComponent((props: MyCustomTSComponentProps) => h('div'))
    `
    const testFile = createTestProgramWithCode(testCode)

    expect(testFile?.statements?.length).toBe(3)
    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
  })

  it('find a single defineComponent statement with object literal setup.', () => {
    const testCode = `
    import { defineComponent, h } from 'vue'
    type MyCustomTSComponentProps = {
      title: string
    }
    export const MyCustomTSComponent = defineComponent({ setup(props: MyCustomTSComponentProps) {} })
    `
    const testFile = createTestProgramWithCode(testCode)

    expect(testFile?.statements?.length).toBe(3)
    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
  })
})
