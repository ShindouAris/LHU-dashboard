import type { TokenType } from '@/components/infsh/code-block/types'

/**
 * Tailwind classes for each token type
 * Uses standard Tailwind colors for portability
 */
export const tokenStyles: Record<TokenType, string> = {
  // Comments - muted and italic
  comment: 'text-zinc-500 italic',

  // Strings - warm amber/orange
  string: 'text-amber-400',

  // Keywords with semantic grouping
  'keyword-import': 'text-pink-400 font-medium',         // import, export, from
  'keyword-declaration': 'text-violet-400 font-medium',  // const, let, function, class
  'keyword-control': 'text-blue-400 font-medium',        // if, else, return, for
  'keyword-value': 'text-cyan-400',                      // true, false, null
  'keyword-other': 'text-violet-400',                    // new, this, typeof

  // Type annotations (TypeScript)
  type: 'text-cyan-400',

  // Numbers - green
  number: 'text-emerald-400',

  // Functions - bright green (when detected)
  function: 'text-green-400',

  // Properties - blue
  property: 'text-blue-400',

  // Operators and punctuation - subtle
  operator: 'text-zinc-400',
  punctuation: 'text-zinc-400',

  // JSX/HTML
  tag: 'text-red-400',              // <Component, </div>
  attribute: 'text-orange-300',     // propName=
}

/**
 * Get the CSS class for a token type
 */
export function getTokenStyle(type: TokenType | null): string | null {
  if (!type) return null
  return tokenStyles[type] ?? null
}
