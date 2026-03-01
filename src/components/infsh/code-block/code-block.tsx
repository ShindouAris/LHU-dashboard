import { cn } from '@/lib/utils'
import { Check, Copy } from 'lucide-react'
import React, { memo, useMemo, useState } from 'react'

import { tokenize, type TokenizeContext } from '@/components/infsh/code-block/tokenizer'
import { normalizeLanguage } from '@/components/infsh/code-block/languages'
import { getTextContent, splitLines, copyToClipboard } from '@/components/infsh/code-block/utils'
import {duotoneDark} from 'react-syntax-highlighter/dist/esm/styles/prism'
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'

// Re-export types for consumers
export type { Token, TokenType, LanguageDefinition } from '@/components/infsh/code-block/types'
export { getLanguage, normalizeLanguage } from '@/components/infsh/code-block/languages'

/**
 * Tokenize all lines with context passing between lines
 * This handles multiline constructs like template literals
 */
function tokenizeLines(lines: string[], language: string) {
  const tokenizedLines: { tokens: ReturnType<typeof tokenize>['tokens'] }[] = []
  let context: TokenizeContext = {}

  for (const line of lines) {
    const result = tokenize(line, language, context)
    tokenizedLines.push({ tokens: result.tokens })
    context = result.context
  }

  return tokenizedLines
}

/**
 * Renders a single line with pre-computed tokens
 */
const HighlightedLine = memo(function HighlightedLine({
  tokens,
}: {
  tokens: ReturnType<typeof tokenize>['tokens']
}) {
  const code = tokens.map(token => token.content).join('')
  
  return (
    <SyntaxHighlighter
      language="javascript"
      style={duotoneDark}
      className="!bg-transparent !p-0 !m-0"
      showLineNumbers={false}
      wrapLines={false}
    >
      {code}
    </SyntaxHighlighter>
  )
})

export interface CodeBlockProps {
  children: React.ReactNode
  language?: string
  className?: string
  /** Show line numbers (default: true) */
  showLineNumbers?: boolean
  /** Show copy button (default: true) */
  showCopyButton?: boolean
  /** Show language header (default: true) */
  showHeader?: boolean
  /** Enable syntax highlighting (default: true) */
  enableHighlighting?: boolean
  /** Custom text size class */
  textSize?: string
}

/**
 * Full-featured code block with syntax highlighting, line numbers, and copy button
 */
export const CodeBlock = memo(function CodeBlock({
  children,
  language,
  className,
  showLineNumbers = true,
  showCopyButton = true,
  showHeader = true,
  enableHighlighting = true,
  textSize,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const text = getTextContent(children)
  const lines = splitLines(text)
  const normalizedLang = normalizeLanguage(language)

  // Pre-tokenize all lines with context passing for multiline support
  const tokenizedLines = useMemo(
    () => enableHighlighting ? tokenizeLines(lines, normalizedLang) : null,
    [lines, normalizedLang, enableHighlighting]
  )

  const handleCopy = async () => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div
      className={cn(
        'relative group/codeblock my-6 rounded-xl border border-border overflow-hidden bg-zinc-950 min-h-0 h-full flex flex-col',
        className
      )}
    >
      {/* Header bar */}
      {showHeader && (
        <div className="flex-none flex items-center justify-between px-4 py-2 border-b border-white/5 bg-zinc-900/50">
          <span className="text-xs text-zinc-500 font-mono">
            {language || 'code'}
          </span>
          {showCopyButton && (
            <button
              onClick={handleCopy}
              className="cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
              aria-label="Copy code"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>copy</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Code content */}
      <pre className="flex-1 min-h-0 overflow-auto p-4">
        <code className={cn('grid font-mono', textSize || 'text-sm')}>
          {lines.map((line, i) => (
            <span
              key={i}
              className={cn(
                'grid gap-6',
                showLineNumbers ? 'grid-cols-[auto_1fr]' : 'grid-cols-1'
              )}
            >
              {showLineNumbers && (
                <span className="text-zinc-600 select-none text-right min-w-[2ch] text-xs leading-6">
                  {i + 1}
                </span>
              )}
              <span className="whitespace-pre-wrap break-all leading-6">
                {tokenizedLines ? (
                  <HighlightedLine tokens={tokenizedLines[i]?.tokens ?? [{ type: null, content: line || ' ' }]} />
                ) : (
                  line || ' '
                )}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
})

export interface CompactCodeBlockProps {
  children: React.ReactNode
  className?: string
  textSize?: string
  /** Optional language for syntax highlighting */
  language?: string
}

/**
 * Simpler code block for compact/chat contexts
 * Optional syntax highlighting, minimal styling
 */
export const CompactCodeBlock = memo(function CompactCodeBlock({
  children,
  className,
  textSize = 'text-xs',
  language,
}: CompactCodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const text = getTextContent(children)
  const lines = splitLines(text)
  const normalizedLang = language ? normalizeLanguage(language) : null

  // Pre-tokenize if language is provided
  const tokenizedLines = useMemo(
    () => normalizedLang ? tokenizeLines(lines, normalizedLang) : null,
    [lines, normalizedLang]
  )

  const handleCopy = async () => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div
      className={cn(
        'relative group/codeblock block bg-muted/30 rounded-lg max-w-full min-w-0 p-2',
        className
      )}
    >
      <button
        onClick={handleCopy}
        className="cursor-pointer absolute top-1 right-1 p-1.5 rounded bg-background/80 hover:bg-background border border-border opacity-0 group-hover/codeblock:opacity-100 transition-opacity z-10"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-pink-400" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      <pre className="overflow-x-auto">
        <code className="grid">
          {lines.map((line, i) => (
            <span key={i} className="grid grid-cols-[auto_1fr] gap-4">
              <span
                className={cn(
                  textSize,
                  'text-muted-foreground/30 select-none text-right min-w-[2ch]'
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  textSize,
                  'whitespace-pre-wrap break-all',
                  !tokenizedLines && 'text-muted-foreground'
                )}
              >
                {tokenizedLines ? (
                  <HighlightedLine tokens={tokenizedLines[i]?.tokens ?? [{ type: null, content: line || ' ' }]} />
                ) : (
                  line || ' '
                )}
              </span>
            </span>
          ))}
        </code>
      </pre>
    </div>
  )
})