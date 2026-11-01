import { describe, expect, test } from 'bun:test'
import { escapeHtml, formatNoteHtml } from './notes-format'

// Tags que o formatador pode emitir (com ou sem atributo class)
const ALLOWED_TAG = /<\/?(strong|em|code|h1|h2|h3|li|p|br)(\s+class="[^"]*")?\s*\/?>/g

describe('formatNoteHtml — XSS', () => {
  test('script em texto puro vira texto literal', () => {
    expect(formatNoteHtml('<script>alert(1)</script>')).toBe(
      '<p class="mb-2">&lt;script&gt;alert(1)&lt;/script&gt;</p>',
    )
  })

  test('img com onerror vira texto literal', () => {
    expect(formatNoteHtml('<img src=x onerror=alert(1)>')).toBe(
      '<p class="mb-2">&lt;img src=x onerror=alert(1)&gt;</p>',
    )
  })

  test('tentativa de sair de atributo dentro de negrito fica escapada', () => {
    expect(formatNoteHtml('**"><img src=x onerror=alert(1)>**')).toBe(
      '<strong class="font-semibold text-foreground">&quot;&gt;&lt;img src=x onerror=alert(1)&gt;</strong>',
    )
  })

  test('payload dentro de code span continua escapado', () => {
    const html = formatNoteHtml('`<script>alert(1)</script>`')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script')
  })

  test('payload dentro de título continua escapado', () => {
    expect(formatNoteHtml('# <svg onload=alert(1)>')).toBe(
      '<h1 class="text-xl font-bold mt-4 mb-2 text-foreground">&lt;svg onload=alert(1)&gt;</h1>',
    )
  })

  test('payload dentro de item de lista continua escapado', () => {
    expect(formatNoteHtml('- <a href="javascript:alert(1)">x</a>')).toBe(
      '<li class="ml-4 list-disc list-inside">&lt;a href=&quot;javascript:alert(1)&quot;&gt;x&lt;/a&gt;</li>',
    )
  })

  test('propriedade da allowlist: nenhum "<" sobra fora das tags fixas', () => {
    const payloads = [
      '<script>alert(1)</script>',
      '<img src=x onerror=alert(1)>',
      '**"><img src=x onerror=alert(1)>**',
      '`<script>alert(1)</script>`',
      '# <svg onload=alert(1)>',
      '- <a href="javascript:alert(1)">x</a>',
      'ok\n<iframe src=javascript:alert(1)></iframe>',
    ]
    for (const payload of payloads) {
      const stripped = formatNoteHtml(payload).replace(ALLOWED_TAG, '')
      expect(stripped).not.toContain('<')
    }
  })
})

describe('escapeHtml', () => {
  test('escapa & < > " \'', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;')
  })

  test('escapa & primeiro, exatamente uma vez', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;')
  })
})
