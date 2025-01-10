import { describe, expect, it } from 'vitest'
import { createTestProgramWithCode } from './utils'

describe('defineComponent property types check', () => {
  it('check most common types', () => {
    const testCode = `
        import { defineComponent, h } from 'vue'

        type MyCustomProps = {
            reqString: string
            opString?: string
            anOpString: string | undefined
            reqNumber: string
            reqDate: Date
            opNumber?: number
            messages?: string[]
            unionType: number | string
            deeperUnion?: Array<string | number> | string[] | number[]
            callee: ((param: number) => boolean) | string | undefined
            callback?(): void
        }

        type MyCustomEvents = {
            click(): void
            fire(name: string): boolean
        }
        
        const MyCustomTSComponent = defineComponent<MyCustomProps, MyCustomEvents>({})
        `

    const testFile = createTestProgramWithCode(testCode)

    // console.log(testFile?.result?.MyCustomTSComponent.props)
    // console.log(testFile?.result?.MyCustomTSComponent.events)

    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props?.length).toBe(11)
    expect(testFile?.result?.MyCustomTSComponent.events?.length).toBe(2)
  })
})
