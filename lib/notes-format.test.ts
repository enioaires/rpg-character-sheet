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

// Referência congelada do comportamento ANTES da correção (BUG-03), usada só
// para provar paridade de renderização. Nunca importar em código da aplicação.
function legacyFormat(text: string): string {
  let formatted = text
    .replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-semibold text-foreground">$1</strong>',
    )
    .replace(/\*(.*?)\*/g, '<em class="italic text-muted-foreground">$1</em>')
    .replace(
      /`(.*?)`/g,
      '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border">$1</code>',
    )
    .replace(
      /^### (.*$)/gm,
      '<h3 class="text-base font-semibold mt-3 mb-1 text-foreground">$1</h3>',
    )
    .replace(
      /^## (.*$)/gm,
      '<h2 class="text-lg font-semibold mt-4 mb-2 text-foreground">$1</h2>',
    )
    .replace(
      /^# (.*$)/gm,
      '<h1 class="text-xl font-bold mt-4 mb-2 text-foreground">$1</h1>',
    )
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc list-inside">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/\n/g, '<br />')

  if (!formatted.startsWith('<')) {
    formatted = `<p class="mb-2">${formatted}</p>`
  }

  return formatted
}

describe('formatNoteHtml — paridade de formatação', () => {
  test('negrito', () => {
    expect(formatNoteHtml('**forte**')).toBe(
      '<strong class="font-semibold text-foreground">forte</strong>',
    )
  })

  test('itálico', () => {
    expect(formatNoteHtml('*leve*')).toBe(
      '<em class="italic text-muted-foreground">leve</em>',
    )
  })

  test('código inline', () => {
    expect(formatNoteHtml('`d20`')).toBe(
      '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border">d20</code>',
    )
  })

  test('título h1', () => {
    expect(formatNoteHtml('# Título')).toBe(
      '<h1 class="text-xl font-bold mt-4 mb-2 text-foreground">Título</h1>',
    )
  })

  test('título h2', () => {
    expect(formatNoteHtml('## Seção')).toBe(
      '<h2 class="text-lg font-semibold mt-4 mb-2 text-foreground">Seção</h2>',
    )
  })

  test('título h3', () => {
    expect(formatNoteHtml('### Sub')).toBe(
      '<h3 class="text-base font-semibold mt-3 mb-1 text-foreground">Sub</h3>',
    )
  })

  test('item de lista', () => {
    expect(formatNoteHtml('- espada')).toBe(
      '<li class="ml-4 list-disc list-inside">espada</li>',
    )
  })

  test('quebra de linha simples', () => {
    expect(formatNoteHtml('linha 1\nlinha 2')).toBe(
      '<p class="mb-2">linha 1<br />linha 2</p>',
    )
  })

  test('parágrafos separados por linha em branco', () => {
    expect(formatNoteHtml('parágrafo 1\n\nparágrafo 2')).toBe(
      '<p class="mb-2">parágrafo 1</p><p class="mb-2">parágrafo 2</p>',
    )
  })

  test('texto simples é envolvido em parágrafo', () => {
    expect(formatNoteHtml('texto simples')).toBe(
      '<p class="mb-2">texto simples</p>',
    )
  })

  test('texto vazio gera parágrafo vazio', () => {
    expect(formatNoteHtml('')).toBe('<p class="mb-2"></p>')
  })

  test('texto seguido de lista', () => {
    expect(formatNoteHtml('Inventário:\n- corda\n- tocha')).toBe(
      '<p class="mb-2">Inventário:<br /><li class="ml-4 list-disc list-inside">corda</li><br /><li class="ml-4 list-disc list-inside">tocha</li></p>',
    )
  })

  test('"<" literal inicial agora é texto e é envolvido em parágrafo', () => {
    expect(formatNoteHtml('<3 meu personagem')).toBe(
      '<p class="mb-2">&lt;3 meu personagem</p>',
    )
  })

  test('entidades digitadas aparecem literalmente, sem decodificar', () => {
    expect(formatNoteHtml("&lt;b&gt; 'x'")).toBe(
      '<p class="mb-2">&amp;lt;b&amp;gt; &#39;x&#39;</p>',
    )
  })

  test('notas normais renderizam byte a byte igual ao formatador legado', () => {
    // Corpus sem & < > " ' — os únicos caracteres cuja saída muda de propósito
    const corpus = [
      '**forte**',
      '*leve*',
      '`d20`',
      '# Título',
      '## Seção',
      '### Sub',
      '- espada',
      'linha 1\nlinha 2',
      'parágrafo 1\n\nparágrafo 2',
      'texto simples',
      '',
      'Inventário:\n- corda\n- tocha',
      '# Ficha\n- **espada** longa\n- *escudo* de `madeira`\n\nNotas da sessão 3',
      '## Sessão 4\n\nChegamos a Vale Cinzento ao anoitecer. O grupo descansou na estalagem.\n- **Mara** achou um mapa antigo\n- *Tiago* perdeu a bolsa de moedas\n\n### Pendências\n- Falar com o ferreiro\n- Comprar 3 poções de cura',
      'Resumo rápido:\nO chefe tem 40 de vida e usa `fogo` duas vezes por turno.\nLembrar de gastar **1 berkana** antes da rolagem.\n\n# Próxima sessão\nIr até a torre do norte',
    ]
    for (const input of corpus) {
      expect(formatNoteHtml(input)).toBe(legacyFormat(input))
    }
  })
})
