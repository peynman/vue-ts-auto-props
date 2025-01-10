import ts from 'typescript'

/**
 * An interface to describe extracted property metadata.
 */
export interface VuePropsMeta {
  name: string
  type?: string | string[]
  default?: any
  required?: boolean
  jsDoc?: string | string[]
}

/**
 * Entire meta data about a single defineComponent statement.
 */
export interface VueResolvedMeta {
  props: VuePropsMeta[]
  events: VuePropsMeta[]
  slots: VuePropsMeta[]
}

/**
 * Type hinting resolved component in AST.
 */
interface VueResolveIntermediate {
  propertyArgType?: ts.TypeNode
  eventsArgType?: ts.TypeNode
  slotsArgType?: ts.TypeNode
  excludedPropNames: string[]
  excludedEventNames: string[]
  excludedSlotNames: string[]
}

/**
 * Auto props transform.
 * Iterates and finds Props, Events, Slots in Vue 3 RenderFunction API.
 * Uses defineComponent call expression on generic component definition
 * and FunctionalComponent variable type to find functional components.
 */
export default class VueTsAutoPropsTransform {
  checker: ts.TypeChecker
  hideWarnings: boolean

  constructor(checker: ts.TypeChecker, hideWarnings: boolean) {
    this.hideWarnings = hideWarnings
    this.checker = checker
  }

  /**
   * Get property name as string
   *
   * @param propName property name type to extract name string.
   * @returns property name in string.
   */
  getPropertyNameString(
    propName: ts.PropertyName | undefined,
  ): string | undefined {
    if (typeof propName === 'string') {
      return propName
    }
    if (propName) {
      if (ts.isIdentifier(propName)) {
        return propName.escapedText.toString()
      }
      if (ts.isStringLiteral(propName) || ts.isNumericLiteral(propName)) {
        return propName.getText()
      }
      if (ts.isComputedPropertyName(propName)) {
        return undefined
      }
    }

    return undefined
  }

  /**
   * Process all kinds of type nodes and return a string
   * corresponding for type declaration in Vue javascript props.
   *
   * @param type type node to process.
   * @returns resolved type in string.
   */
  resolveTypeScriptTypeToVue(
    type: ts.Node | undefined,
  ): string | string[] | undefined {
    if (!type) {
      return undefined
    }

    switch (type?.kind) {
      case ts.SyntaxKind.IntersectionType:
      case ts.SyntaxKind.UnionType:
        return (
          type as ts.UnionTypeNode | ts.IntersectionTypeNode
        ).types?.reduce((arr: string[], t: ts.TypeNode) => {
          const resolvedItem = this.resolveTypeScriptTypeToVue(t)
          if (resolvedItem) {
            if (Array.isArray(resolvedItem)) {
              arr.push(...resolvedItem)
            } else {
              arr.push(resolvedItem)
            }
          }
          return arr
        }, [])
      case ts.SyntaxKind.ArrayType:
        return `Array<${(type as ts.ArrayTypeNode).elementType.getText()}>`
      case ts.SyntaxKind.FunctionType:
        return type.getFullText()
      case ts.SyntaxKind.ParenthesizedType:
        return this.resolveTypeScriptTypeToVue(
          (type as ts.ParenthesizedTypeNode).type,
        )
      case ts.SyntaxKind.TypeAliasDeclaration:
        return this.getPropertyNameString((type as ts.TypeAliasDeclaration).name)
      case ts.SyntaxKind.LiteralType:
        return (type as ts.LiteralTypeNode).literal.getText()
      case ts.SyntaxKind.TypeLiteral:
        return (type as ts.TypeLiteralNode).getText()
      case ts.SyntaxKind.ImportSpecifier:
        {
          const importSymbol = this.checker.getSymbolAtLocation(
            (type as ts.ImportSpecifier).name,
          )
          if (importSymbol) {
            const importAlias = this.checker.getAliasedSymbol(importSymbol)
            if (importAlias) {
              const importDeclRef = importAlias.declarations?.[0]
              if (importDeclRef && ts.isTypeAliasDeclaration(importDeclRef)) {
                return this.resolveTypeScriptTypeToVue(importDeclRef)
              }
            } else {
              return (type as ts.ImportTypeNode).getText()
            }
          }
        }
        // otherwise return type class name
        return (((type as ts.TypeReferenceNode).typeName as ts.Identifier).escapedText.toString()
        )
      case ts.SyntaxKind.TypeReference:
        {
          // get symbol for this type reference
          const trSymbol = this.checker.getSymbolAtLocation(
            (type as ts.TypeReferenceNode).typeName,
          )
          // find if this symbol has declarations
          const trDeclaration = trSymbol?.getDeclarations()?.[0]
          // recursively resolve imports
          if (trDeclaration && trDeclaration.kind === ts.SyntaxKind.ImportSpecifier) {
            return this.resolveTypeScriptTypeToVue(trDeclaration)
          }

          if (trSymbol?.escapedName === 'Array') {
            const args = (type as ts.TypeReferenceNode).typeArguments?.[0]
            if (args) {
              const innerType = this.resolveTypeScriptTypeToVue(args)
              if (innerType) {
                return `Array<${innerType}>`
              }
            }

            return 'Array'
          }
        }
        // otherwise return type class name
        return (
          ((type as ts.TypeReferenceNode).typeName as ts.Identifier)
            .escapedText ?? '<type-not-found>'
        )
      case ts.SyntaxKind.StringKeyword:
        return 'String'
      case ts.SyntaxKind.BooleanKeyword:
        return 'Boolean'
      case ts.SyntaxKind.NumberKeyword:
        return 'Number'
      case ts.SyntaxKind.ObjectKeyword:
        return 'Object'
      case ts.SyntaxKind.AnyKeyword:
        return 'Any'
      case ts.SyntaxKind.UndefinedKeyword:
        return 'Undefined'
    }
  }

  /**
   * Get a single meta from PropertySignature.
   *
   * @param prop property to use.
   * @returns meta of that property signature.
   */
  getVuePropFromPropertySignature(prop: ts.PropertySignature): VuePropsMeta | undefined {
    const propName = this.getPropertyNameString(prop.name)
    if (propName) {
      const propType = this.resolveTypeScriptTypeToVue((prop).type)
      const hasUndefined = Array.isArray(propType) ? propType.includes('Undefined') : false
      const questionToken = (prop as ts.PropertySignature | ts.MethodSignature).questionToken

      return {
        name: propName,
        required: !hasUndefined && questionToken === undefined,
        type: propType,
        jsDoc: ts.getJSDocCommentsAndTags(prop).map(doc => doc.getText()),
      }
    }
  }

  /**
   * Get a single meta from MethodSignature.
   *
   * @param prop method signature to use.
   * @returns meta of this method signature.
   */
  getVuePropFromMethodSignature(prop: ts.MethodSignature): VuePropsMeta | undefined {
    const propName = this.getPropertyNameString(prop.name)
    if (propName) {
      const propType = this.checker.typeToString(this.checker.getTypeAtLocation(prop))
      const questionToken = (prop as ts.PropertySignature | ts.MethodSignature).questionToken

      return {
        name: propName,
        required: questionToken === undefined,
        type: propType,
        jsDoc: ts.getJSDocCommentsAndTags(prop).map(doc => doc.getText()),
      }
    }
  }

  /**
   * Convert a typescript type node to the corresponding
   * list of VuePropsMeta for each property in this type.
   * Covers 3 types of node:
   * 1.TypeReference: recursively call this function again on first declaration of type reference.
   * 2.TypeLiteral: iterate on members and convert each TypeElement.
   * 3.IntersectionType: recursively call this function again on each type in intersection.
   *
   * @param typeNode type to extract props from.
   * @returns {VuePropsMeta[]|undefined} a list of VuePropsMeta.
   */
  getVuePropsFromTypeScriptTypeNode(
    typeNode: ts.Node,
  ): VuePropsMeta[] | undefined {
    switch (typeNode.kind) {
      case ts.SyntaxKind.TypeReference:
        {
          const typeRefSymbol = this.checker.getSymbolAtLocation(
            (typeNode as ts.TypeReferenceNode).typeName,
          )
          if (typeRefSymbol) {
            // get type reference declarations
            const typeDec = typeRefSymbol.declarations?.[0]
            if (typeDec) {
              let recursiveNodeToResolve: ts.Node | undefined
              // for type alias (types defined in same file), just mark for recursive call
              if (ts.isTypeAliasDeclaration(typeDec)) {
                recursiveNodeToResolve = (typeDec as ts.TypeAliasDeclaration).type
              } else if (ts.isImportSpecifier(typeDec)) { // for imports, resolve import and then mark for recursive call
                const importAlias = this.checker.getAliasedSymbol(typeRefSymbol)
                if (importAlias) {
                  const importAliasDec = importAlias.declarations?.[0]
                  if (importAliasDec && ts.isTypeAliasDeclaration(importAliasDec)) {
                    recursiveNodeToResolve = (
                      importAliasDec as ts.TypeAliasDeclaration
                    ).type
                  }
                } else {
                  if (!this.hideWarnings) {
                    console.warn('type reference import does not resolve to type alias')
                  }
                }
              } else if (ts.isInterfaceDeclaration(typeDec)) {
                recursiveNodeToResolve = typeDec
              }

              // recursive call on inner type literal in alias
              if (recursiveNodeToResolve) {
                return this.getVuePropsFromTypeScriptTypeNode(recursiveNodeToResolve)
              } else {
                if (!this.hideWarnings) {
                  console.warn('type reference with unknown type of declaration')
                }
              }
            } else {
              if (!this.hideWarnings) {
                console.warn('type reference does not resolve to a declaration')
              }
            }
          } else {
            if (!this.hideWarnings) {
              console.warn('type reference does not resolve to a symbol')
            }
          }
        }
        break
      case ts.SyntaxKind.InterfaceDeclaration:
      case ts.SyntaxKind.TypeLiteral:
        return (typeNode as ts.TypeLiteralNode | ts.InterfaceDeclaration)
          .members
          ?.filter((member: ts.TypeElement) => ts.isPropertySignature(member) || ts.isMethodSignature(member))
          .reduce((arr: VuePropsMeta[], member: ts.TypeElement) => {
            if (ts.isPropertySignature(member)) {
              const resolved = this.getVuePropFromPropertySignature(member)
              if (resolved) {
                arr.push(resolved)
              }
            } else if (ts.isMethodSignature(member)) {
              const resolved = this.getVuePropFromMethodSignature(member)
              if (resolved) {
                arr.push(resolved)
              }
            }
            return arr
          }, [])
      case ts.SyntaxKind.IntersectionType:
        return (typeNode as ts.IntersectionTypeNode).types?.reduce(
          (arr: VuePropsMeta[], t: ts.TypeNode) => {
            if (ts.isTypeLiteralNode(t) || ts.isTypeReferenceNode(t)) {
              const convertedProps = this.getVuePropsFromTypeScriptTypeNode(t)
              if (convertedProps && Array.isArray(convertedProps)) {
                arr.push(...convertedProps)
              }
            } else if (ts.isTypeAliasDeclaration(t)) {
              if (!this.hideWarnings) {
                console.warn('Intersection type resolved to type alias.')
              }
            }
            return arr
          },
          [],
        )
    }
  }

  /**
   * Find all meta data about manually declared component.
   *
   * @param comp component object literal expression in ast.
   * @returns property,event,slots args type with property,event,slot names declared manually
   */
  getComponentMetaFromObjectLiteralComponent(comp: ts.ObjectLiteralExpression): VueResolveIntermediate {
    let propertyArgType: ts.TypeNode | undefined
    let eventsArgType: ts.TypeNode | undefined
    let slotsArgType: ts.TypeNode | undefined
    const excludedPropNames: string[] = []
    const excludedEventNames: string[] = []
    const excludedSlotNames: string[] = []

    comp.properties.forEach((fap) => {
      // find setup function in object literal and extract props type
      if (fap.kind === ts.SyntaxKind.MethodDeclaration && fap.name?.getText() === 'setup') {
        propertyArgType = fap.parameters?.[0]?.type
        eventsArgType = (fap.parameters?.[1]?.type as ts.TypeReferenceNode)?.typeArguments?.[0]
        slotsArgType = (fap.parameters?.[1]?.type as ts.TypeReferenceNode)?.typeArguments?.[1]
      } else if (fap.kind === ts.SyntaxKind.PropertyAssignment && fap.name?.getText() === 'props') {
        // find props property on object literal so we can exclude manually provided properties
        const manualPropsInitializer = (fap as ts.PropertyAssignment).initializer as ts.ObjectLiteralExpression
        if (ts.isObjectLiteralExpression(manualPropsInitializer)) {
          const manualPropNames = manualPropsInitializer.properties.map((prop: ts.ObjectLiteralElementLike) => prop.name?.getText() ?? '')
          excludedPropNames.push(...manualPropNames)
        }
      } else if (fap.kind === ts.SyntaxKind.PropertyAssignment && fap.name?.getText() === 'events') {
        // find events on object literal so we can exclude manually provided properties
        const manualPropsInitializer = (fap as ts.PropertyAssignment).initializer as ts.ObjectLiteralExpression
        if (ts.isObjectLiteralExpression(manualPropsInitializer)) {
          const manualPropNames = manualPropsInitializer.properties.map((prop: ts.ObjectLiteralElementLike) => prop.name?.getText() ?? '')
          excludedEventNames.push(...manualPropNames)
        }
      }
    })

    return {
      propertyArgType,
      eventsArgType,
      slotsArgType,
      excludedPropNames,
      excludedEventNames,
      excludedSlotNames,
    }
  }

  /**
   * Search and resolve defineComponent properties in a list of statements.
   *
   * @param statements list of statements to search for defineComponent.
   * @returns resolved meta data about statements.
   */
  resolveComponents(statements: ts.NodeArray<ts.Statement>): { [key: string]: VueResolvedMeta } {
    const autoCodes: { [key: string]: VueResolvedMeta } = {}

    statements.forEach((statement: ts.Statement) => {
      if (statement.kind === ts.SyntaxKind.VariableStatement) {
        // right now, auto props only supports defineComponent or FunctionalComponent
        // when used in a variable declaration statement
        (statement as ts.VariableStatement).declarationList?.declarations?.forEach(
          (dec: ts.VariableDeclaration) => {
            if (dec.initializer?.kind === ts.SyntaxKind.CallExpression) {
              const callExp = dec.initializer as ts.CallExpression
              const expression = callExp?.expression as ts.Identifier
              if (expression.escapedText === 'defineComponent') {
                // defineComponent found

                // extract component name and meta data
                const componentName = ((dec as ts.VariableDeclaration).name as ts.Identifier).escapedText
                const autoCode = {
                  props: undefined as VuePropsMeta[] | undefined,
                  events: undefined as VuePropsMeta[] | undefined,
                  slots: [],
                  excludedPropNames: [] as string[],
                  excludedEventNames: [] as string[],
                  excludedSlotNames: [] as string[],
                }

                // check for template types in defineComponent call

                /**
                 * detect defaults to defineComponent<CustomProps, CustomEvents, CustomSlots>
                 */
                let propertyArgType: ts.TypeNode | undefined = callExp.typeArguments?.[0]
                let eventsArgType: ts.TypeNode | undefined = callExp.typeArguments?.[1]
                let slotsArgType: ts.TypeNode | undefined = callExp.typeArguments?.[2]

                // check for first defineComponent arg
                const firstArg = callExp.arguments?.[0]
                if (firstArg.kind === ts.SyntaxKind.ArrowFunction) {
                  /**
                   * detected defineComponent((props: CustomProps, ctx: SetupContext<CustomEvents, CustomSlots>) => {})
                   */
                  const arrowFunctionParams = (firstArg as ts.ArrowFunction).parameters

                  propertyArgType = propertyArgType || arrowFunctionParams?.[0]?.type
                  eventsArgType = eventsArgType || (arrowFunctionParams?.[1]?.type as ts.TypeReferenceNode)?.typeArguments?.[0]
                  slotsArgType = slotsArgType || (arrowFunctionParams?.[1]?.type as ts.TypeReferenceNode)?.typeArguments?.[1]

                  // if first arg is arrow function in defineComponent, check for second arg as object literal
                  const secondArg = callExp.arguments?.[1]
                  if (secondArg && secondArg.kind === ts.SyntaxKind.ObjectLiteralExpression) {
                    const literalMeta = this.getComponentMetaFromObjectLiteralComponent(secondArg as ts.ObjectLiteralExpression)
                    autoCode.excludedPropNames = literalMeta.excludedPropNames
                  }
                } else if (firstArg.kind === ts.SyntaxKind.ObjectLiteralExpression) {
                  /**
                   * detected defineComponent({ setup(prop: CustomProps, ctx: SetupContext<CustomEvents, CustomSlots>) {} })
                   */
                  const literalMeta = this.getComponentMetaFromObjectLiteralComponent(firstArg as ts.ObjectLiteralExpression)
                  propertyArgType = propertyArgType || literalMeta.propertyArgType
                  eventsArgType = eventsArgType || literalMeta.eventsArgType
                  slotsArgType = slotsArgType || literalMeta.slotsArgType
                  autoCode.excludedPropNames = literalMeta.excludedPropNames
                }

                if (propertyArgType) {
                  autoCode.props = (this.getVuePropsFromTypeScriptTypeNode(propertyArgType) ?? [])
                    .filter((prop: VuePropsMeta) => !autoCode.excludedPropNames.includes(prop.name))
                }
                if (eventsArgType) {
                  autoCode.events = (this.getVuePropsFromTypeScriptTypeNode(eventsArgType) ?? [])
                }
                if (slotsArgType) {
                  autoCode.events = (this.getVuePropsFromTypeScriptTypeNode(slotsArgType) ?? [])
                }

                if (componentName && autoCode && autoCode.props) {
                  autoCodes[componentName] = autoCode as VueResolvedMeta
                }
              }
            } else if (
              dec.initializer?.kind === ts.SyntaxKind.ArrowFunction
              && ((dec.type as ts.TypeReferenceNode).typeName as ts.Identifier).escapedText === 'FunctionalComponent'
            ) {
              // functional component found
              const arrowRef = dec.type as ts.TypeReferenceNode
              const arrowFunc = dec.initializer as ts.ArrowFunction
              const arrowFunctionParams = arrowFunc.parameters

              let propertyArgType = arrowRef.typeArguments?.[0]
              let eventsArgType = arrowRef.typeArguments?.[1]
              let slotsArgType = arrowRef.typeArguments?.[2]

              propertyArgType = propertyArgType || arrowFunctionParams?.[0]?.type
              eventsArgType = eventsArgType || (arrowFunctionParams?.[1]?.type as ts.TypeReferenceNode)?.typeArguments?.[0]
              slotsArgType = slotsArgType || (arrowFunctionParams?.[1]?.type as ts.TypeReferenceNode)?.typeArguments?.[1]

              // extract component name and meta data
              const componentName = ((dec as ts.VariableDeclaration).name as ts.Identifier).escapedText
              const autoCode = {
                props: undefined as VuePropsMeta[] | undefined,
                events: undefined as VuePropsMeta[] | undefined,
                slots: undefined as VuePropsMeta[] | undefined,
                excludedPropNames: [] as string[],
                excludedEventNames: [] as string[],
                excludedSlotNames: [] as string[],
              }

              if (propertyArgType) {
                autoCode.props = (this.getVuePropsFromTypeScriptTypeNode(propertyArgType) ?? [])
              }
              if (eventsArgType) {
                autoCode.events = (this.getVuePropsFromTypeScriptTypeNode(eventsArgType) ?? [])
              }
              if (slotsArgType) {
                autoCode.slots = (this.getVuePropsFromTypeScriptTypeNode(slotsArgType) ?? [])
              }

              if (componentName && autoCode && autoCode.props) {
                autoCodes[componentName] = autoCode as VueResolvedMeta
              }
            }
          },
        )
      }
    })

    return autoCodes
  }
}
