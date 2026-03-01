import type { Token, TokenType, LanguageDefinition } from '@/components/infsh/code-block/types'
import { getLanguage } from '@/components/infsh/code-block/languages'

export interface TokenizeContext {
  /** Whether we're inside a multiline template literal */
  inTemplateLiteral?: boolean
  /** Whether we're inside a multiline comment */
  inMultilineComment?: boolean
}

/**
 * Get the keyword type for a word in a given language
 */
function getKeywordType(word: string, lang: LanguageDefinition): TokenType | null {
  const { keywords } = lang

  if (keywords.import?.has(word)) return 'keyword-import'
  if (keywords.declaration?.has(word)) return 'keyword-declaration'
  if (keywords.control?.has(word)) return 'keyword-control'
  if (keywords.value?.has(word)) return 'keyword-value'
  if (keywords.type?.has(word)) return 'type'
  if (keywords.other?.has(word)) return 'keyword-other'

  return null
}

/**
 * Try to match a pattern at the start of the remaining code
 */
function tryMatch(remaining: string, patterns: RegExp[] | undefined): string | null {
  if (!patterns) return null

  for (const pattern of patterns) {
    const match = remaining.match(pattern)
    if (match) {
      return match[0]
    }
  }

  return null
}

/**
 * Check if language supports JSX
 */
function isJsxLanguage(languageName: string): boolean {
  const jsxLangs = ['javascript', 'typescript', 'jsx', 'tsx', 'js', 'ts']
  return jsxLangs.includes(languageName.toLowerCase())
}

/**
 * Check if language is JSON
 */
function isJsonLanguage(languageName: string): boolean {
  return ['json', 'jsonc'].includes(languageName.toLowerCase())
}

/**
 * Heuristic: detect if a line likely starts inside a JSX tag
 * This handles multi-line JSX where attributes are on separate lines
 *
 * Patterns that suggest we're inside a JSX tag:
 * - Line starts with whitespace + attribute pattern (word followed by = and { or " or ')
 * - Line starts with whitespace + />
 * - Line starts with whitespace + > followed by content or closing tag
 */
function detectJsxContext(code: string): boolean {
  // Check for: whitespace + /> (self-closing)
  if (/^\s+\/>/.test(code)) {
    return true
  }
  // Check for: whitespace + > (closing bracket, but not >= operator)
  if (/^\s+>(?!=)/.test(code)) {
    return true
  }
  // Check for JSX attribute: whitespace + word + = + { or " or ' (not word=word which is normal code)
  // This distinguishes "  propName={" from "  const x ="
  if (/^\s+[a-zA-Z_][a-zA-Z0-9_-]*\s*=\s*[{{"']/.test(code)) {
    return true
  }
  // Check for: whitespace + { (JSX expression in attribute value on its own line)
  if (/^\s+\{\s*$/.test(code) || /^\s+\{[^}]*$/.test(code)) {
    return true
  }
  return false
}

/**
 * Tokenize a line of code with context for multiline constructs
 */
export function tokenize(
  code: string,
  languageName: string,
  context?: TokenizeContext
): { tokens: Token[]; context: TokenizeContext } {
  const lang = getLanguage(languageName)
  const tokens: Token[] = []
  let remaining = code
  const supportsJsx = isJsxLanguage(languageName)
  const isJson = isJsonLanguage(languageName)

  // Carry over context from previous line
  let inTemplateLiteral = context?.inTemplateLiteral ?? false

  // If we're inside a template literal from a previous line, treat the whole line as a string
  // until we find a closing backtick
  if (inTemplateLiteral) {
    const closingIndex = remaining.indexOf('`')
    if (closingIndex === -1) {
      // No closing backtick, entire line is part of string
      tokens.push({ type: 'string', content: remaining })
      return { tokens, context: { inTemplateLiteral: true } }
    } else {
      // Found closing backtick
      const stringPart = remaining.slice(0, closingIndex + 1)
      tokens.push({ type: 'string', content: stringPart })
      remaining = remaining.slice(closingIndex + 1)
      inTemplateLiteral = false
      // Continue tokenizing the rest of the line
    }
  }

  // Track if we're inside a JSX tag (between < and >)
  // Use heuristic to detect if line starts in JSX context
  let inJsxTag = supportsJsx && detectJsxContext(code) && !inTemplateLiteral

  while (remaining.length > 0) {
    let matched = false

    // Try to match comments (but not in JSX tag context)
    if (!inJsxTag && lang?.patterns.comment) {
      const comment = tryMatch(remaining, lang.patterns.comment)
      if (comment) {
        tokens.push({ type: 'comment', content: comment })
        remaining = remaining.slice(comment.length)
        matched = true
        continue
      }
    }

    // JSX handling for JS/TS languages
    if (supportsJsx) {
      // Opening tag: <Component or <div or </Component
      const jsxOpenTag = remaining.match(/^<\/?([A-Z][a-zA-Z0-9]*|[a-z][a-z0-9-]*)/)
      if (jsxOpenTag) {
        // Push the < or </
        const bracket = remaining[0] === '<' && remaining[1] === '/' ? '</' : '<'
        tokens.push({ type: 'punctuation', content: bracket })
        remaining = remaining.slice(bracket.length)

        // Push the tag name
        const tagName = jsxOpenTag[1]
        tokens.push({ type: 'tag', content: tagName })
        remaining = remaining.slice(tagName.length)

        inJsxTag = true
        matched = true
        continue
      }

      // Self-closing /> or closing >
      if (inJsxTag) {
        if (remaining.startsWith('/>')) {
          tokens.push({ type: 'punctuation', content: '/>' })
          remaining = remaining.slice(2)
          inJsxTag = false
          matched = true
          continue
        }
        if (remaining.startsWith('>')) {
          tokens.push({ type: 'punctuation', content: '>' })
          remaining = remaining.slice(1)
          inJsxTag = false
          matched = true
          continue
        }

        // JSX attribute: propName= or propName (boolean) or propName (before />)
        const jsxAttr = remaining.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)(?=\s*=|\s*\/>|\s*>|\s+[a-zA-Z_]|\s*$)/)
        if (jsxAttr) {
          tokens.push({ type: 'attribute', content: jsxAttr[1] })
          remaining = remaining.slice(jsxAttr[1].length)
          matched = true
          continue
        }
      }
    }

    // Try to match strings
    if (lang?.patterns.string) {
      const str = tryMatch(remaining, lang.patterns.string)
      if (str) {
        // In JSON, check if this string is a key (followed by :)
        const afterStr = remaining.slice(str.length)
        const isJsonKey = isJson && /^\s*:/.test(afterStr)
        tokens.push({ type: isJsonKey ? 'property' : 'string', content: str })
        remaining = remaining.slice(str.length)
        matched = true
        continue
      }

      // Check for template literal that starts but doesn't end (multiline)
      // Only trigger if we're AT a backtick and it doesn't close on this line
      if (remaining[0] === '`') {
        // Template literal starts but no closing backtick on this line
        tokens.push({ type: 'string', content: remaining })
        return { tokens, context: { inTemplateLiteral: true } }
      }
    }

    // Fallback string patterns for unknown languages
    if (!lang) {
      const doubleStr = remaining.match(/^"(?:[^"\\]|\\.)*"/)
      if (doubleStr) {
        tokens.push({ type: 'string', content: doubleStr[0] })
        remaining = remaining.slice(doubleStr[0].length)
        matched = true
        continue
      }

      const singleStr = remaining.match(/^'(?:[^'\\]|\\.)*'/)
      if (singleStr) {
        tokens.push({ type: 'string', content: singleStr[0] })
        remaining = remaining.slice(singleStr[0].length)
        matched = true
        continue
      }
    }

    // Numbers
    const number = remaining.match(/^-?\b\d+\.?\d*(?:e[+-]?\d+)?\b/i)
    if (number) {
      tokens.push({ type: 'number', content: number[0] })
      remaining = remaining.slice(number[0].length)
      matched = true
      continue
    }

    // Keywords and identifiers (when not in JSX tag)
    const word = remaining.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/)
    if (word) {
      const afterWord = remaining.slice(word[0].length)
      // Check if this is an object property key (word followed by : but not ::)
      const isPropertyKey = /^\s*:(?!:)/.test(afterWord)

      let tokenType: TokenType | null = null
      if (isPropertyKey) {
        tokenType = 'property'
      } else if (lang && !inJsxTag) {
        tokenType = getKeywordType(word[0], lang)
      }

      tokens.push({
        type: tokenType,
        content: word[0],
      })
      remaining = remaining.slice(word[0].length)
      matched = true
      continue
    }

    // Operators (common across most languages)
    const operator = remaining.match(
      /^(?:===|!==|==|!=|<=|>=|=>|->|::|\.\.\.?|\?\?|\?\.|&&|\|\||[+\-*/%<>=!&|^~?:])/
    )
    if (operator) {
      tokens.push({ type: 'operator', content: operator[0] })
      remaining = remaining.slice(operator[0].length)
      matched = true
      continue
    }

    // Punctuation
    const punct = remaining.match(/^[{}[\]();,.<>]/)
    if (punct) {
      tokens.push({ type: 'punctuation', content: punct[0] })
      remaining = remaining.slice(punct[0].length)
      matched = true
      continue
    }

    // Default: single character (whitespace, etc.)
    if (!matched) {
      tokens.push({ type: null, content: remaining[0] })
      remaining = remaining.slice(1)
    }
  }

  return { tokens, context: { inTemplateLiteral } }
}
