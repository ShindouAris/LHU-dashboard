import React from 'react'

/**
 * Extract text content from React children
 * Handles strings, numbers, arrays, and nested elements
 */
export function getTextContent(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (!node) return ''
  if (Array.isArray(node)) return node.map(getTextContent).join('')
  if (React.isValidElement(node)) {
    return getTextContent((node.props as { children?: React.ReactNode }).children)
  }
  return ''
}

/**
 * Split code into lines, removing trailing empty line if present
 */
export function splitLines(code: string): string[] {
  const lines = code.split('\n')
  if (lines.length > 1 && lines[lines.length - 1] === '') {
    lines.pop()
  }
  return lines
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
