import { describe, expect, it } from 'vitest'
import { createTestProgramWithCode } from './utils'
import { genStringFromResolvedComponentsMap } from '../src/core/utils'

describe('package test:', () => {
  it('test', () => {
    expect(1).toBe(1)
  })

  it('super test', () => {
    const testCode = `
          import { defineComponent, h, AsyncComponentLoader } from 'vue'
  
          type MyCustomEvents = {
            click(): void
            fire(name: string): boolean
          }
          type Density = 'none' | 'compact' | 'dense' | 0 | 1 | string[]
          type ObjArrEnum =  'header' | 'footer'
          type CallbackRef = ((event: string) => void) | number | keyof MyCustomEvents
          type CallbackFunctionOnly = (event: string) => void | number | keyof MyCustomEvents
          type MyCustomProps = {
              title: string
              subtitle?: string
              posts?: string[]
              contacts?: Array<string | number>
              notes?: number[] | string[]
              boolValue: boolean
              object: Component
              callback: (event: string) => void
              callbackRef: CallbackRef
              callF: CallbackFunctionOnly
              density: Density
              def: ObjArrEnum
          }
          
          const MyCustomTSComponent = defineComponent<MyCustomProps, MyCustomEvents>({})

          export default MyCustomTSComponent
          `

    const testFile = createTestProgramWithCode(testCode)

    // console.log(testFile?.result?.MyCustomTSComponent.props)
    // console.log(testFile?.result?.MyCustomTSComponent.events)

    expect(Object.keys(testFile?.result ?? {}).length).toBe(1)
    expect(Object.keys(testFile?.result ?? {}).includes('MyCustomTSComponent')).toBe(true)
    expect(testFile?.result?.MyCustomTSComponent.props?.length).toBe(12)
    expect(testFile?.result?.MyCustomTSComponent.events?.length).toBe(2)

    if (testFile.result) {
      const genCode = genStringFromResolvedComponentsMap(testFile.result)
      console.log(genCode)
    }
  })
})
