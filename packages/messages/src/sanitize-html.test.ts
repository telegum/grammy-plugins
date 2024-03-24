import { describe, expect, it } from 'vitest'
import { sanitizeHtml } from './sanitize-html'

describe('sanitize-html', () => {
  it('does not modify strings without HTML', () => {
    expect(sanitizeHtml('')).toBe('')
    expect(sanitizeHtml('Hello, world!')).toBe('Hello, world!')
  })

  it('sanitizes HTML', () => {
    expect(sanitizeHtml('<script>alert("Ha-ha!")</script>')).toBe('&lt;script&gt;alert("Ha-ha!")&lt;/script&gt;')
    expect(sanitizeHtml('1 < 2 & 3 > 4')).toBe('1 &lt; 2 &amp; 3 &gt; 4')
    expect(sanitizeHtml('<a href="https://fishing.url">FREE MONEY!</a>')).toBe('&lt;a href="https://fishing.url"&gt;FREE MONEY!&lt;/a&gt;')
  })
})
