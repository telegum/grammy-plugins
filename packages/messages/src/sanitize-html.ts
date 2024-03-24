export function sanitizeHtml(unsafe: string): string {
  return unsafe
    .replaceAll('&', '&amp;') // must be first
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
