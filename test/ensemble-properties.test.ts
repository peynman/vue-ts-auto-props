import { describe, expect, it } from 'vitest'
import { createTestProgramWithCode } from './utils'

describe('defineComponent ensemble property check', () => {
  it('component with ensemble as template', () => {
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

        type OtherProperties = {
            messages: string[]
        }

        const MyCustomTSComponent = defineComponent<MyCustomProps & OtherProperties & {
            literal: boolean
        }>({})
        `

    const testFile = createTestProgramWithCode([testCode, importCode])

    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props?.length).toBe(6)
  })

  it('component with ensemble as arrow function property type', () => {
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

        type OtherProperties = {
            messages: string[]
            showAll?: boolean
        }

        const MyCustomTSComponent = defineComponent((props: MyCustomProps & OtherProperties & {
            literal: boolean
        }) => {})
        `

    const testFile = createTestProgramWithCode([testCode, importCode])

    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props?.length).toBe(7)
  })

  it('component with ensemble as setup function property type', () => {
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

        type OtherProperties = {
            messages: string[]
            showAll?: boolean
        }

        const MyCustomTSComponent = defineComponent({ setup(props: MyCustomProps & OtherProperties & {
            literal: boolean
            caption?: string | string[]
        }) {})
        `

    const testFile = createTestProgramWithCode([testCode, importCode])

    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props?.length).toBe(8)
  })
})
