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
  currentVitality: { notavel: 0, ferido: 1000, current: 1070 },
  maxBerkana: 170,
  currentBerkana: 85,
  berkanaBonus: 15,
  attributes: { agilidade: { race: 8, class: 6, bonus: 1 } },
  characterName: 'Kael',
  playerName: 'Enio',
  class: 'Caçador Errante',
  weapons: [
    {
      name: 'Espada Longa',
      level: 37,
      damage: { d25: '3000', critical: '7000' },
      description: 'Lâmina antiga',
    },
    null,
    { name: 'Adaga' },
  ],
  armor: { name: 'Traje', description: 'Couro e Aço', totalVitality: 1500, currentVitality: 1125 },
  languages: { standard: { comum: true }, custom: [{ name: 'Malashin', known: true }] },
}

beforeEach(() => {
  useUpdateCharacter.mockClear()
  mutateAsync.mockClear()
  openSheet.mockClear()
})

describe('BasicInfoTab: Vitalidade e Berkana', () => {
  it('Vitalidade mostra total único, uma barra, campos editáveis e botões', async () => {
    const html = await render(fixtureA, true)

    expect(html).toContain('1.070')
    expect(html).toContain('5.350')
    expect(html).toContain('width:20%')
    expect(html).toContain('Atual')
    expect(html).toContain('Base da raça')
    expect(html).toContain('Base da classe')
    expect(html).toContain('Por nível')
    expect(html).toContain('Dano')
    expect(html).toContain('Cura')
    expect(html).not.toContain('Ferido')
    expect(html).not.toContain('Notável')
    expect(html).not.toContain('O dano desce')
    expect(html).not.toMatch(/\d\/6/)
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

  it('vitalidade não configurada mostra o rótulo neutro e a barra vazia', async () => {
    const html = await render({ ...fixtureA, level: 0, vitality: { race: 0, class: 0 }, currentVitality: {} }, true)
    expect(html).toContain('Sem vitalidade definida')
    expect(html).toContain('width:0%')
  })
})

describe('BasicInfoTab: Atributos, Experiência e Informações Básicas', () => {
  it('Atributos mostra o total com bônus de nível, a legenda real e a tabela recolhida', async () => {
    const html = await render(fixtureA, true)

    expect(html).toContain('inclui +1 de nível')
    expect(html).toContain('>16<')
    expect(html).toContain('Distribuição (raça + classe + bônus + nível)')
    expect(html).toContain('aria-expanded="false"')
    // Recolhida: o cabeçalho da tabela não é renderizado
    expect(html).not.toContain('Cla.')
  })

  it('nível 0 não mostra a legenda "inclui +"', async () => {
    const html = await render({ ...fixtureA, level: 0 }, true)
    expect(html).not.toContain('inclui +')
  })

  it('Experiência mostra o que falta e a barra em 71,25%', async () => {
    const html = await render(fixtureA, true)
    expect(html).toContain('Faltam 23 XP para o nível 8')
    expect(html).toContain('width:71.25%')
  })

  it('Informações Básicas mostra rótulos de hoje e os valores', async () => {
    const html = await render(fixtureA, true)
    expect(html).toContain('Tendência')
    expect(html).toContain('Pontos de Virtude')
    expect(html).toContain('Caçador Errante')
    expect(html).toContain('Kael')
  })

  it('ordem: Atributos, Experiência e Nível e Informações Básicas depois de Vitalidade e Berkana', async () => {
    const titles = headings(await render(fixtureA, true))
    const position = (title: string) => titles.indexOf(title)

    expect(position('Vitalidade')).toBe(0)
    expect(position('Berkana')).toBe(1)
    expect(position('Atributos')).toBeGreaterThan(position('Berkana'))
    expect(position('Experiência e Nível')).toBeGreaterThan(position('Atributos'))
    expect(position('Informações Básicas')).toBeGreaterThan(position('Experiência e Nível'))
  })
})

describe('BasicInfoTab: Armas, Armadura e Linguagens', () => {
  const TITLES = [
    'Vitalidade',
    'Berkana',
    'Armas',
    'Atributos',
    'Experiência e Nível',
    'Armadura',
    'Informações Básicas',
    'Linguagens',
  ]

  it('desbloqueada: os oito cards na ordem do design', async () => {
    expect(headings(await render(fixtureA, true))).toEqual(TITLES)
  })

  it('desbloqueada: armas com nível, danos, crítico, descrição, dica e slot vazio editável', async () => {
    const html = await render(fixtureA, true)

    for (const text of ['Espada Longa', 'Nv', '3000', '7000', 'Crít.', 'Lâmina antiga']) {
      expect(html).toContain(text)
    }
    expect(html).toContain('Máximo de 3 armas.')
    expect(html).toContain('Nome da Arma 2')
  })

  it('desbloqueada: armadura com a barra em 75%', async () => {
    const html = await render(fixtureA, true)

    for (const text of ['Traje', 'Couro e Aço', '1125', '1500', 'width:75%']) {
      expect(html).toContain(text)
    }
  })

  it('desbloqueada: linguagens são chips alternáveis, com "Outra"', async () => {
    const html = await render(fixtureA, true)

    for (const text of ['Élfico', 'Sigílico', 'Malashin', 'Outra', 'aria-pressed="true"', 'aria-pressed="false"', 'role="button"']) {
      expect(html).toContain(text)
    }
  })

  it('bloqueada: nenhum controle de edição, mas os quatro botões de sheet continuam', async () => {
    const html = await render(fixtureA, false)

    for (const text of ['role="button"', 'Outra', 'Máximo de 3 armas.', 'Nome da Arma 2', 'aria-pressed']) {
      expect(html).not.toContain(text)
    }
    for (const text of ['Dano', 'Cura', 'Gastar', 'Recuperar', 'Espada Longa', 'Adaga', 'Malashin', '16', '1.070']) {
      expect(html).toContain(text)
    }
  })

  it('bloqueada sem armas mostra o estado vazio', async () => {
    const html = await render({ ...fixtureA, weapons: [] }, false)
    expect(html).toContain('Nenhuma arma cadastrada.')
  })

  it('nenhum render, bloqueado ou não, grava ou abre sheet', async () => {
    await render(fixtureA, true)
    await render(fixtureA, false)
    expect(mutateAsync).toHaveBeenCalledTimes(0)
    expect(openSheet).toHaveBeenCalledTimes(0)
  })
})
