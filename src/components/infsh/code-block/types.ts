export type TokenType =
  | 'comment'
  | 'string'
  | 'keyword-import'      // import, export, from, as
  | 'keyword-declaration' // const, let, var, function, class, type, interface
  | 'keyword-control'     // if, else, return, for, while
  | 'keyword-value'       // true, false, null, undefined
  | 'keyword-other'       // new, this, typeof, etc.
  | 'number'
  | 'function'
  | 'property'
  | 'operator'
  | 'punctuation'
  | 'type'                // type annotations in TS
  | 'tag'                 // JSX/HTML tag names
  | 'attribute'           // JSX/HTML attributes

export interface Token {
  type: TokenType | null
  content: string
}

export interface LanguageDefinition {
  name: string
  aliases: string[]
  keywords: {
    import?: Set<string>
    declaration?: Set<string>
    control?: Set<string>
    value?: Set<string>
    other?: Set<string>
    type?: Set<string>
  }
  patterns: {
    comment?: RegExp[]
    string?: RegExp[]
  }
}
