// Testes de render das telas de estado da ficha (carregando, não encontrada, erro de carga)
// e do PageState compartilhado.
//
// Não importa '@/lib/api/queries': notes-tab.render.test.ts substitui esse módulo
// para o processo inteiro do `bun test`.

import { describe, expect, it } from 'bun:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { ScrollText } from 'lucide-react'
import {
  CharacterLoadErrorState,
  CharacterNotFoundState,
  CharacterSheetSkeleton,
  isCharacterNotFoundError,
} from './sheet-states'
import { PageState, SkeletonBlock } from '@/components/ui/page-state'

const noop = () => {}

// ============================================
// CLASSIFICADOR DE 404
// ============================================

describe('isCharacterNotFoundError', () => {
  it('é verdadeiro só para o Error do 404 de fetchCharacter', () => {
    expect(isCharacterNotFoundError(new Error('Character not found'))).toBe(true)
  })

  it('é falso para outros erros e valores', () => {
    expect(isCharacterNotFoundError(new Error('Failed to fetch character'))).toBe(false)
    expect(isCharacterNotFoundError(new TypeError('Failed to fetch'))).toBe(false)
    expect(isCharacterNotFoundError('Character not found')).toBe(false)
    expect(isCharacterNotFoundError(null)).toBe(false)
    expect(isCharacterNotFoundError(undefined)).toBe(false)
  })
})

// ============================================
// TELAS DA FICHA
// ============================================

describe('CharacterSheetSkeleton', () => {
  it('é um status ocupado com blocos pulsando e texto para leitores de tela', () => {
    const html = renderToString(createElement(CharacterSheetSkeleton))
    expect(html).toContain('role="status"')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('animate-ficha-pulse')
    expect(html).toContain('Carregando personagem…')
  })
})

describe('CharacterNotFoundState', () => {
  it('mostra o texto do design sem retry quando onRetry não é passado', () => {
    const html = renderToString(createElement(CharacterNotFoundState, { onBack: noop }))
    expect(html).toContain('Personagem não encontrado')
    expect(html).toContain('Esta ficha pode ter sido excluída ou o link está errado.')
    expect(html).toContain('Voltar para a lista')
    expect(html).toContain('aria-label="Voltar"')
    expect(html).toContain('lucide-skull')
    expect(html).toContain('text-destructive')
    expect(html).not.toContain('Tentar de novo')
  })

  it('mostra o retry quando onRetry é passado', () => {
    const html = renderToString(
      createElement(CharacterNotFoundState, { onBack: noop, onRetry: noop }),
    )
    expect(html).toContain('Tentar de novo')
  })
})

describe('CharacterLoadErrorState', () => {
  it('usa a cópia verdadeira para rede e servidor (DEC-11)', () => {
    const html = renderToString(
      createElement(CharacterLoadErrorState, { onBack: noop, onRetry: noop }),
    )
    expect(html).toContain('Não foi possível carregar a ficha')
    expect(html).toContain('Verifique a conexão ou tente de novo em instantes.')
    expect(html).toContain('Tentar de novo')
    expect(html).toContain('Voltar para a lista')
    expect(html).toContain('lucide-cloud-off')
    expect(html).not.toContain('Sem conexão')
  })
})

// ============================================
// PAGE STATE
// ============================================

describe('PageState', () => {
  it('variante empty usa título serifado de 22px e ícone neutro', () => {
    const html = renderToString(
      createElement(PageState, { icon: ScrollText, variant: 'empty', title: 'Vazio' }),
    )
    expect(html).toContain('text-[22px]')
    expect(html).toContain('font-serif')
    expect(html).not.toContain('text-destructive')
  })

  it('variante error usa a cor destrutiva e título text-2xl', () => {
    const html = renderToString(
      createElement(PageState, { icon: ScrollText, variant: 'error', title: 'Erro' }),
    )
    expect(html).toContain('text-destructive')
    expect(html).toContain('text-2xl')
  })

  it('escapa texto vindo do usuário na descrição', () => {
    const html = renderToString(
      createElement(PageState, {
        icon: ScrollText,
        title: 'Nada encontrado',
        description: 'Nenhuma ficha com “<script>alert(1)</script>”',
      }),
    )
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>')
  })
})

describe('SkeletonBlock', () => {
  it('pulsa por padrão e não pulsa com pulse={false}', () => {
    expect(renderToString(createElement(SkeletonBlock, { className: 'h-3' }))).toContain(
      'animate-ficha-pulse',
    )
    expect(
      renderToString(createElement(SkeletonBlock, { className: 'h-3', pulse: false })),
    ).not.toContain('animate-ficha-pulse')
  })
})
