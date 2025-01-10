import { describe, expect, it } from 'vitest'
import { createTestProgramWithCode } from './utils'

describe('defineComponent import properties', () => {
  it('component with import as template', () => {
    const importCode = `
        export type PostInterface = {
            title: string
        }
        export type MyCustomProps = {
            title: string
            badge?: number
            subtitle?: number | string
            posts?: PostInterface[]
        }
        `
    const testCode = `
        import { defineComponent, h } from 'vue'
        import { MyCustomProps } from '/tmp/virtual_template_1.ts'
        const MyCustomTSComponent = defineComponent<MyCustomProps>({})
        `

    const testFile = createTestProgramWithCode([testCode, importCode])

    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props?.length).toBe(4)
  })

  it('component with import as arrow function property type', () => {
    const importCode = `
        export type PostInterface = {
            title: string
        }
        export type MyCustomProps = {
            title: string
            badge?: number
            subtitle?: number | string
            posts?: PostInterface[]
        }
        `
    const testCode = `
        import { defineComponent, h } from 'vue'
        import { MyCustomProps } from '/tmp/virtual_template_1.ts'
        const MyCustomTSComponent = defineComponent((props: MyCustomProps) => {})
        `

    const testFile = createTestProgramWithCode([testCode, importCode])

    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props?.length).toBe(4)
  })

  it('component with import as setup function property type', () => {
    const importCode = `
        export type PostInterface = {
            title: string
        }
        export type MyCustomProps = {
            title: string
            badge?: number
            subtitle?: number | string
            posts?: PostInterface[]
        }
        `
    const testCode = `
        import { defineComponent, h } from 'vue'
        import { MyCustomProps } from '/tmp/virtual_template_1.ts'
        const MyCustomTSComponent = defineComponent({
            setup(props: MyCustomProps) {}
        })
        `

    const testFile = createTestProgramWithCode([testCode, importCode])

    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props?.length).toBe(4)
  })
})
