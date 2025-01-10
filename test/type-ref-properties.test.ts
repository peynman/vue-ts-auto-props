import { describe, expect, it } from 'vitest'
import { createTestProgramWithCode } from './utils'

describe('defineComponent type ref properties', () => {
  it('component with type ref as template', () => {
    const testCode = `
        import { defineComponent, h } from 'vue'
        type MyCustomProps = {
            title: string
            badge?: number
        }
        const MyCustomTSComponent = defineComponent<MyCustomProps>({})
        `

    const testFile = createTestProgramWithCode(testCode)

    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props?.length).toBe(2)
  })

  it('component with type ref as arrow function prop type', () => {
    const testCode = `
        import { defineComponent, h } from 'vue'
        type MyCustomProps = {
            title: string
            badge?: number
            subtitle?: number | string
        }
        
        const MyCustomTSComponent = defineComponent((props: MyCustomProps) => {})
        `

    const testFile = createTestProgramWithCode(testCode)

    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props?.length).toBe(3)
  })

  it('component with type ref as setup function prop type', () => {
    const testCode = `
        import { defineComponent, h } from 'vue'
        type PostInterface = {
            title: string
        }
        type MyCustomProps = {
            title: string
            badge?: number
            subtitle?: number | string
            posts?: PostInterface[]
        }
        
        const MyCustomTSComponent = defineComponent({
            setup(props: MyCustomProps) {}
        })
        `

    const testFile = createTestProgramWithCode(testCode)

    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props?.length).toBe(4)
  })
})
