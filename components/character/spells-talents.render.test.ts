// Testes de render da aba Magias e Talentos (DS-06): ordem dos grupos, dano escalonado na
// linha de apoio, selos, ações travadas/destravadas e render sem chamadas de rede.
//
// ATENÇÃO: notes-tab.render.test.ts (e o teste da aba Perícias) substituem '@/lib/api/queries'
// para todo o processo do `bun test` e conferem as chamadas de useUpdateCharacter. Este arquivo
// NÃO mocka esse módulo de novo: envolve a aba em QueryClientProvider, o que funciona com o
// módulo real ou com o substituído, e entrega uma mutação falsa direto ao TalentsCard.
// renderToString não executa efeitos nem eventos: os cliques são cobertos pelos testes dos
// helpers (índices e payloads) e pela revisão manual.

import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { CharacterData, UpdateCharacterMutation } from './types'

let fetchSpy: ReturnType<typeof spyOn>

beforeEach(() => {
  fetchSpy = spyOn(globalThis, 'fetch')
})

afterEach(() => {
  // Renderizar nunca grava nem busca
  expect(fetchSpy).not.toHaveBeenCalled()
  fetchSpy.mockRestore()
})

// renderToString separa nós de texto adjacentes com comentários; removemos para comparar o texto
const strip = (html: string) => html.replace(/<!-- -->/g, '')

async function renderTab(character: Record<string, unknown>, isEditMode: boolean): Promise<string> {
  const { SpellsTalentsTab } = await import('./spells-talents-tab')
  return strip(
    renderToString(
      createElement(
        QueryClientProvider,
        { client: new QueryClient() },
        createElement(SpellsTalentsTab, {
          character: character as unknown as CharacterData,
          characterId: 'test-char',
          isEditMode,
        })
      )
    )
  )
}

async function renderTalents(
  character: Record<string, unknown>,
  isEditMode: boolean,
  mutateAsync: ReturnType<typeof mock>
): Promise<string> {
  const { TalentsCard } = await import('./spells-talents/talents-card')
  const updateCharacterMutation = { mutateAsync, isPending: false } as unknown as UpdateCharacterMutation
  return strip(
    renderToString(
      createElement(TalentsCard, {
        character: character as unknown as CharacterData,
        characterId: 'test-char',
        isEditMode,
        updateCharacterMutation,
      })
    )
  )
}

const count = (html: string, needle: string) => html.split(needle).length - 1

// Ordem guardada: A (nível 1), B (nível 0, dano em texto legado), C (nível 1, dano nulo)
const character = {
  level: 3,
  spells: [
    {
      name: 'Desvastar',
      level: 1,
      berkanaCost: 30,
      type: 'Alteração de Combate',
      range: 'Pessoal',
      damage: { base: 2000, perLevel: 1000 },
      description: 'Linha 1\nLinha 2',
    },
    {
      name: 'Velocidade Alterada',
      level: 0,
      berkanaCost: 25,
      damage: '2000 + 500 P/N',
      range: 'Pessoal',
    },
    { name: 'Catoação', level: 1, berkanaCost: 30, damage: null, range: 'Raio 30 Metros' },
  ],
  talents: [{ name: 'Lutador' }],
}

describe('SpellsTalentsTab', () => {
  it('agrupa por nível, mostra dano escalonado e a barra de filtros', async () => {
    const html = await renderTab(character, true)

    expect(html).toContain('Magias · 3')
    expect(html).toContain('Talentos · 1')
    expect(html.indexOf('Nível 0')).toBeGreaterThan(-1)
    expect(html.indexOf('Nível 0')).toBeLessThan(html.indexOf('Nível 1'))

    // Grupo primeiro, ordem guardada dentro do grupo
    const velocidade = html.indexOf('Velocidade Alterada')
    const desvastar = html.indexOf('Desvastar')
    const catoacao = html.indexOf('Catoação')
    expect(velocidade).toBeGreaterThan(-1)
    expect(velocidade).toBeLessThan(desvastar)
    expect(desvastar).toBeLessThan(catoacao)

    expect(html).toContain('Alteração de Combate · Dano 4000 · Pessoal')
    expect(html).toContain('Dano 3500 · Pessoal')
    expect(html).toContain('Raio 30 Metros')
    expect(html).not.toContain('Dano 0')

    expect(html).toContain('Todos')
    expect(html).toContain('Nv 0')
    expect(html).toContain('Nv 1')
    expect(html).toContain('3 magias, por nível · toque para ver detalhes')
    expect(html).toContain('aria-label="Nova magia"')
    expect(count(html, 'aria-expanded="false"')).toBe(3)
  })

  it('esconde (não desabilita) "Nova magia" quando travada', async () => {
    const html = await renderTab(character, false)
    expect(html).not.toContain('aria-label="Nova magia"')
    expect(html).toContain('Desvastar')
  })

  it('não quebra com spells nulo', async () => {
    const html = await renderTab({ level: 1, spells: null, talents: null }, true)
    expect(html).toContain('Nenhuma magia ou habilidade cadastrada')
    expect(html).toContain('Magias · 0')
  })
})

describe('TalentsCard', () => {
  const talentsCharacter = {
    level: 3,
    talents: [
      {
        name: 'Golpe Acorrentado',
        level: 5,
        oncePerDay: true,
        usedToday: true,
        description: '\nDuelo +3\n\nUma vez ao dia, desarma.',
      },
      { name: 'Sangue Frio', level: 5, description: 'Controle Emocional +5' },
    ],
  }

  it('mostra selo, usado hoje, Novo dia e grupo por nível, sem gravar', async () => {
    const mutateAsync = mock(async () => ({}))
    const html = await renderTalents(talentsCharacter, false, mutateAsync)

    expect(count(html, '1× ao dia')).toBe(1)
    expect(html).toContain('Novo dia')
    expect(html).toContain('line-through')
    expect(html).toContain('Duelo +3')
    expect(html).toContain('Nível 5')
    expect(html).toContain('2 talentos')
    expect(count(html, 'aria-label="Usado hoje"')).toBe(1)
    expect(html).not.toContain('aria-label="Novo talento"')
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('mostra "Novo talento" só quando destravada', async () => {
    const html = await renderTalents(talentsCharacter, true, mock(async () => ({})))
    expect(html).toContain('aria-label="Novo talento"')
  })
})
