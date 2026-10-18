import { describe, test, expect } from 'vitest'
import { sanitizeText } from './sanitizeText'

describe('sanitizeText', () => {
  // --- PASSING TESTS: Normal Text & Basic Escaping ---
  describe('Standard text handling', () => {
    test('handles empty and nullish inputs', () => {
      expect(sanitizeText('')).toBe('')
      expect(sanitizeText(null)).toBe('')
      expect(sanitizeText(undefined)).toBe('')
    })

    test('escapes standalone ampersands and quotes', () => {
      expect(sanitizeText('Tom & Jerry')).toBe('Tom &amp; Jerry')
      expect(sanitizeText("It's a \"test\"")).toBe('It&#39;s a &quot;test&quot;')
    })

    test('strips simple standard HTML tags', () => {
      expect(sanitizeText('<b>Hello</b>')).toBe('Hello')
      expect(sanitizeText('<script>alert(1)</script>')).toBe('alert(1)')
    })
  })

  // --- FAILING TESTS: Edge Cases & XSS Tricks ---
  describe('Tricky XSS and edge cases', () => {
    test('breaks on unclosed tags in attributes', () => {
      // Regex /<[^>]*>/ stops at the first closing '>'
      const input = '<img src="x" title="> Payload" onerror="alert(1)">'
      expect(sanitizeText(input)).not.toContain('onerror=')
    })

    test('breaks on multiline HTML tags with newlines', () => {
      // [^>] matches newlines, so this strips, BUT if someone tricks regex with unclosed tags...
      const input = '<script\nsrc="malicious.js"\n>'
      expect(sanitizeText(input)).toBe('')
    })

    test('breaks on HTML comments or incomplete tags', () => {
      // Unclosed tag at the end of input
      const input = 'Hello <img src="x" onerror="alert(1)"'
      expect(sanitizeText(input)).toBe('Hello ')
    })

    test('breaks on string-based attribute breakouts when tags remain partially stripped', () => {
      // Nested or broken tags: regex removes middle `<tag>`, leaving valid code combined
      const input = '<<script>script>alert(1)</script>'
      // Regex removes `<script>` from middle -> leaves `<script>alert(1)`
      expect(sanitizeText(input)).toBe('alert(1)')
    })

    test('breaks on double-encoding / existing HTML entities', () => {
      // Normal user typing "AT&T" gets double escaped if re-sanitized
      expect(sanitizeText('AT&amp;T')).toBe('AT&amp;amp;T')
    })
  })
})