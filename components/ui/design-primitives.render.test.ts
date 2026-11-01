import { describe, expect, test } from 'bun:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'

import {
  InlineFieldRetry,
  InlineFieldStatusIcon,
  inlineFieldFrameClassName,
  resolveInlineFieldState,
} from './inline-field-state'
import { NumericDisplay } from './numeric-display'
import { SectionCard } from './section-card'
import { StatTile } from './stat-tile'

// ============================================
// ESTADO DOS CAMPOS INLINE
// ============================================

describe('inline-field-state', () => {
  const base = {
    isEditing: false,
    canEdit: true,
    isSaving: false,
    saveStatus: 'idle' as const,
  }

  describe('resolveInlineFieldState', () => {
    test('somente leitura quando não pode editar', () => {
      expect(resolveInlineFieldState({ ...base, canEdit: false })).toBe('readonly')
    })

    test('ocioso quando pode editar', () => {
      expect(resolveInlineFieldState(base)).toBe('idle')
    })

    test('editando', () => {
      expect(resolveInlineFieldState({ ...base, isEditing: true })).toBe('editing')
    })

    test('salvando vence tudo, inclusive erro', () => {
      expect(resolveInlineFieldState({ ...base, isSaving: true })).toBe('saving')
      expect(resolveInlineFieldState({ ...base, isSaving: true, isEditing: true })).toBe('saving')
      expect(
        resolveInlineFieldState({ ...base, isSaving: true, saveStatus: 'error' })
      ).toBe('saving')
    })

    test('erro aparece editando ou não, mesmo sem permissão', () => {
      expect(resolveInlineFieldState({ ...base, saveStatus: 'error' })).toBe('error')
      expect(
        resolveInlineFieldState({ ...base, canEdit: false, saveStatus: 'error' })
      ).toBe('error')
      expect(
        resolveInlineFieldState({ ...base, isEditing: true, saveStatus: 'error' })
      ).toBe('error')
    })

    test('salvo só aparece fora da edição e com permissão', () => {
      expect(resolveInlineFieldState({ ...base, saveStatus: 'saved' })).toBe('saved')
      expect(
        resolveInlineFieldState({ ...base, canEdit: false, saveStatus: 'saved' })
      ).toBe('readonly')
      expect(
        resolveInlineFieldState({ ...base, isEditing: true, saveStatus: 'saved' })
      ).toBe('editing')
    })
  })

  describe('inlineFieldFrameClassName', () => {
    test('ocioso: caixa tracejada de 44px', () => {
      const cls = inlineFieldFrameClassName('idle')
      expect(cls).toContain('border-dashed')
      expect(cls).toContain('border-input')
      expect(cls).toContain('min-h-11')
    })

    test('editando: borda e anel de foco', () => {
      const cls = inlineFieldFrameClassName('editing')
      expect(cls).toContain('border-ring')
      expect(cls).toContain('ring-ring/30')
    })

    test('salvando, salvo e erro', () => {
      expect(inlineFieldFrameClassName('saving')).toContain('border-input')
      expect(inlineFieldFrameClassName('saved')).toContain('border-success')
      expect(inlineFieldFrameClassName('error')).toContain('border-destructive')
    })

    test('somente leitura não tem borda', () => {
      expect(inlineFieldFrameClassName('readonly')).not.toContain('border-')
    })
  })

  describe('InlineFieldStatusIcon', () => {
    test('salvando gira', () => {
      const html = renderToString(createElement(InlineFieldStatusIcon, { state: 'saving' }))
      expect(html).toContain('animate-ficha-spin')
    })

    test('salvo usa a cor de sucesso', () => {
      const html = renderToString(createElement(InlineFieldStatusIcon, { state: 'saved' }))
      expect(html).toContain('text-success')
    })

    test('erro usa a cor destrutiva', () => {
      const html = renderToString(createElement(InlineFieldStatusIcon, { state: 'error' }))
      expect(html).toContain('text-destructive')
    })

    test('ocioso não renderiza nada', () => {
      const html = renderToString(createElement(InlineFieldStatusIcon, { state: 'idle' }))
      expect(html).toBe('')
    })
  })

  describe('InlineFieldRetry', () => {
    test('botão com o texto de tentar de novo', () => {
      const html = renderToString(createElement(InlineFieldRetry, { onRetry: () => {} }))
      expect(html).toContain('type="button"')
      expect(html).toContain('Não salvou · tentar de novo')
    })
  })
})

// ============================================
// SECTION CARD
// ============================================

// Atributos data-* não passam na checagem de literais do createElement
const dataSection = (value: string) => ({ 'data-section': value }) as Record<string, string>

describe('section-card', () => {
  test('renderiza seção com título, losango, sombra e conteúdo', () => {
    const html = renderToString(
      createElement(
        SectionCard,
        { title: 'Vitalidade', action: 'AÇÃO-X', ...dataSection('vitality') },
        'CONTEÚDO-Y'
      )
    )
    expect(html).toContain('<section')
    expect(html).toContain('data-section="vitality"')
    expect(html).toContain('<h2')
    expect(html).toContain('font-serif')
    expect(html).toContain('rotate-45')
    expect(html).toContain('bg-primary')
    expect(html).toContain('shadow-card')
    expect(html).toContain('break-inside-avoid')
    expect(html).toContain('Vitalidade')
    expect(html).toContain('AÇÃO-X')
    expect(html).toContain('CONTEÚDO-Y')
  })

  test('tom berkana e nível de título h3', () => {
    const html = renderToString(
      createElement(SectionCard, { title: 'Berkana', tone: 'berkana', headingLevel: 'h3' })
    )
    expect(html).toContain('bg-berkana')
    expect(html).toContain('<h3')
    expect(html).not.toContain('<h2')
  })
})

// ============================================
// NUMERIC DISPLAY
// ============================================

describe('numeric-display', () => {
  test('hero com máximo', () => {
    const html = renderToString(createElement(NumericDisplay, { value: 56, max: 450, size: 'hero' }))
    expect(html).toContain('font-numeric')
    expect(html).toContain('tabular-nums')
    expect(html).toContain('text-[56px]')
    expect(html).toContain('56')
    expect(html).toContain('450')
    expect(html).toContain('text-muted-foreground')
  })

  test('sem máximo não mostra barra', () => {
    const html = renderToString(createElement(NumericDisplay, { value: 56, size: 'hero' }))
    expect(html).not.toContain(' / ')
    expect(html).not.toContain('text-muted-foreground')
  })
})

// ============================================
// STAT TILE
// ============================================

describe('stat-tile', () => {
  test('tile tem fundo muted e número tabular', () => {
    const html = renderToString(createElement(StatTile, { label: 'Agilidade', value: 7 }))
    expect(html).toContain('bg-muted')
    expect(html).toContain('font-numeric')
    expect(html).toContain('Agilidade')
  })

  test('bare não tem fundo', () => {
    const html = renderToString(
      createElement(StatTile, { label: 'Agilidade', value: 7, variant: 'bare' })
    )
    expect(html).not.toContain('bg-muted')
  })
})
