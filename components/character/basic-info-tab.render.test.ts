// Testes de render da aba Básicos (DS-04): ordem dos cards, números exibidos,
// comportamento bloqueado/desbloqueado e render sem gravações.
//
// renderToString não executa efeitos nem eventos: os cliques que abrem as sheets e as
// gravações são cobertos pelos testes de lib/calculations e pela revisão manual.
//
// ATENÇÃO: mock.module do bun vale para o processo inteiro do `bun test`. Este
// arquivo substitui '@/lib/api/queries' para todos os arquivos de teste da mesma
// execução; um teste futuro que precise do módulo real deve levar isso em conta.

import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { QuickSheetContext } from './quick-sheets/quick-sheet-context'
import type { CharacterData } from './types'

const mutateAsync = mock(async () => ({}))
const useUpdateCharacter = mock(() => ({
  mutateAsync,
  isPending: false,
  error: null,
}))

mock.module('@/lib/api/queries', () => ({ useUpdateCharacter }))

const openSheet = mock((kind: string) => kind)

// renderToString separa nós de texto adjacentes com comentários; removemos para comparar o texto
async function render(character: Record<string, unknown>, isEditMode: boolean): Promise<string> {
  const { BasicInfoTab } = await import('./basic-info-tab')
  return renderToString(
    createElement(
      QuickSheetContext.Provider,
      { value: { openSheet } },
      createElement(BasicInfoTab, {
        character: character as unknown as CharacterData,
        characterId: 'test-char',
        isEditMode,
      }),
    ),
  ).replace(/<!-- -->/g, '')
}

// Títulos (h2/h3) na ordem do documento, sem as tags internas
function headings(html: string): string[] {
  return [...html.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/g)].map((match) => match[1].replace(/<[^>]*>/g, '').trim())
}

// Fixture A: personagem de nível 7 como no caso do plano
const fixtureA = {
  level: 7,
  currentXP: 57,
  vitality: { race: 200, class: 250 },
  currentVitality: { notavel: 0, ferido: 1000 },
  maxBerkana: 170,
  currentBerkana: 85,
  berkanaBonus: 15,
}

beforeEach(() => {
  useUpdateCharacter.mockClear()
  mutateAsync.mockClear()
  openSheet.mockClear()
})

describe('BasicInfoTab: Vitalidade e Berkana', () => {
  it('Vitalidade mostra totais, estágio, posição, linha atual e botões', async () => {
    const html = await render(fixtureA, true)

    expect(html).toContain('13.160')
    expect(html).toContain('19.200')
    expect(html).toContain('2/6')
    expect(html).toContain('text-vitality-ferido')
    expect(html).toContain('atual')
    expect(html).toContain('Dano')
    expect(html).toContain('Cura')
    expect(html).toContain('O dano desce do Notável até o Coma.')
  })

  it('Berkana mostra estado, botões e a barra em 50%', async () => {
    const html = await render(fixtureA, true)

    expect(html).toContain('Pela metade')
    expect(html).toContain('Gastar')
    expect(html).toContain('Recuperar')
    expect(html).toContain('width:50%')
  })

  it('os dois primeiros títulos são Vitalidade e Berkana', async () => {
    const html = await render(fixtureA, true)
    expect(headings(html).slice(0, 2)).toEqual(['Vitalidade', 'Berkana'])
  })

  it('nenhum campo está em edição no render e o card não tem entrada de dano', async () => {
    const html = await render(fixtureA, true)
    expect(html).not.toContain('<input')
  })

  it('render nunca grava nem abre sheet', async () => {
    await render(fixtureA, true)
    await render(fixtureA, false)
    expect(mutateAsync).toHaveBeenCalledTimes(0)
    expect(openSheet).toHaveBeenCalledTimes(0)
  })

  it('vitalidade não configurada mostra o rótulo neutro e nenhum Coma', async () => {
    const html = await render({ ...fixtureA, level: 0, vitality: { race: 0, class: 0 }, currentVitality: {} }, true)
    expect(html).toContain('Sem vitalidade definida')
    expect(html).not.toContain('text-vitality-coma')
  })
})
