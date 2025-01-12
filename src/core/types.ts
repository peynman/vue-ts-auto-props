export interface Options {
  /** typescript config path. */
  tsConfigPath?: string
  /** hide auto props resolve warnings. */
  hideWarnings?: boolean
  /** include jsdoc in generated code. */
  includeJSDoc?: false | 'as-comment' | 'as-meta-data'
}
