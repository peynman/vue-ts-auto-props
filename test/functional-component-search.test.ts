import { describe, expect, it } from 'vitest'
import { createTestProgramWithCode } from './utils'

describe('functionalComponent search test:', () => {
  it('find a single FunctionalComponent with props type in template.', () => {
    const testCode = `
    import { FunctionalComponent, h } from 'vue'
    type MyCustomTSComponentProps = {
      title: string
    }
    export const MyCustomTSComponent: FunctionalComponent<MyCustomTSComponentProps> = (props, events) => {
        return h('div')
    }
    `
    const testFile = createTestProgramWithCode(testCode)

    expect(testFile?.statements?.length).toBe(3)
    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
  })

  it('find a single FunctionalComponent with props type in arrow function arg.', () => {
    const testCode = `
    import { FunctionalComponent, h } from 'vue'
    type MyCustomTSComponentProps = {
      title: string
    }
    export const MyCustomTSComponent: FunctionalComponent = (props: MyCustomTSComponentProps, events) => {
        return h('div')
    }
    `
    const testFile = createTestProgramWithCode(testCode)

    expect(testFile?.statements?.length).toBe(3)
    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
  })

  it('find multiple FunctionalComponent.', () => {
    const testCode = `
    import { FunctionalComponent, h } from 'vue'
    type MyCustomTSComponentProps = {
      title: string
    }
    export const MyCustomTSComponent: FunctionalComponent = (props: MyCustomTSComponentProps, events) => {
        return h('div')
    }
    export const MyCustomSecondComponent: FunctionalComponent<MyCustomTSComponentProps> = (props, events) => {
        return h('div')
    }
    `
    const testFile = createTestProgramWithCode(testCode)

    expect(testFile?.statements?.length).toBe(4)
    expect(Object.keys(testFile?.result ?? {}).length).toBe(2)
  })
})
