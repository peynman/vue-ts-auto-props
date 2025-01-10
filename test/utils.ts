import process from 'node:process'
import ts, { createLanguageService } from 'typescript'
import { expect } from 'vitest'
import type { VueResolvedMeta } from '../src/core/transform'
import VueTsAutoPropsTransform from '../src/core/transform'

export function createTestProgramWithCode(sourceCode: string | string[], autoParseIndex: number = 0): {
  program?: ts.Program
  checker?: ts.TypeChecker
  statements?: ts.NodeArray<ts.Statement>
  transform?: VueTsAutoPropsTransform
  result?: { [key: string]: VueResolvedMeta }
} {
  const sourceCodes = (Array.isArray(sourceCode) ? sourceCode : [sourceCode])
  const sourceFilenames = sourceCodes.reduce((obj, code, index) => {
    obj[`/tmp/virtual_template_${index}.ts`] = code
    return obj
  }, {} as { [key: string]: string })
  const languageService = createLanguageService({
    getScriptFileNames: () => Object.keys(sourceFilenames),
    getScriptVersion: () => '1',
    getScriptSnapshot: (fileName) => {
      // console.log('snap custom file', fileName)
      if (Object.keys(sourceFilenames).includes(fileName)) {
        return ts.ScriptSnapshot.fromString(sourceFilenames[fileName])
      }

      const file = ts.sys.readFile(fileName)
      return file
        ? ts.ScriptSnapshot.fromString(file)
        : undefined
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => ts.getDefaultCompilerOptions(),
    getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
    fileExists: () => true,
    readFile: (path: string, encoding?: string): string => {
      // console.log('read custom file', path)
      if (Object.keys(sourceFilenames).includes(path)) {
        return sourceFilenames[path]
      }

      return ts.sys.readFile(path, encoding) ?? ''
    },
  })
  const program = languageService.getProgram()
  // console.log(Object.keys(sourceFilenames))
  if (autoParseIndex >= 0) {
    const testFile = program?.getSourceFile(`/tmp/virtual_template_${autoParseIndex}.ts`)
    const checker = program?.getTypeChecker()

    if (testFile && checker) {
      const transform = new VueTsAutoPropsTransform(checker, false)
      const result = transform.resolveComponents(testFile?.statements)

      return {
        program,
        checker: program?.getTypeChecker(),
        statements: testFile?.statements,
        transform,
        result,
      }
    } else {
      expect('test could not find virtual file')
    }
  }

  return {
    program,
    checker: program?.getTypeChecker(),
  }
}
