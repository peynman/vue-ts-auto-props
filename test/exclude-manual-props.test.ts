import { describe, expect, it } from 'vitest'
import { createTestProgramWithCode } from './utils'

describe('check excluding manual props', () => {
  it('excluding from object literal', () => {
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
        }>({
            props: {
                messages: {
                    type: Array,
                    default: () => []
                },
                badge: {
                    type: Number,
                    default: 2
                },
            },
            setup(props) {

            }
        })
        `

    const testFile = createTestProgramWithCode([testCode, importCode])
    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props?.length).toBe(4)
  })

  it('excluding from arrow function second arg', () => {
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
        }>((props) => {},{
            props: {
                messages: {
                    type: Array,
                    default: () => []
                },
                badge: {
                    type: Number,
                    default: 2
                },
            }
        })
        `

    const testFile = createTestProgramWithCode([testCode, importCode])
    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props?.length).toBe(4)
  })
})
