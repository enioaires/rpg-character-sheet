// Testes de render da aba Perícias e Kit (DS-05): números, grupos, filtro, ordem do kit,
// comportamento bloqueado/desbloqueado e render sem gravações.
//
// renderToString não executa efeitos nem eventos: os cliques dos steppers e do kit são
// cobertos pelos testes do modelo (payloads) e pela revisão manual.
//
// ATENÇÃO: mock.module do bun vale para o processo inteiro do `bun test`. Este
// arquivo substitui '@/lib/api/queries' para todos os arquivos de teste da mesma
// execução; um teste futuro que precise do módulo real deve levar isso em conta.

import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import type { CharacterData } from './types'

const mutateAsync = mock(async () => ({}))
const useUpdateCharacter = mock(() => ({
  mutateAsync,
  isPending: false,
  error: null,
}))

mock.module('@/lib/api/queries', () => ({ useUpdateCharacter }))

// renderToString separa nós de texto adjacentes com comentários; removemos para comparar o texto
async function render(character: Record<string, unknown>, isEditMode: boolean): Promise<string> {
  const { SkillsKitTab } = await import('./skills-kit-tab')
  return renderToString(
    createElement(SkillsKitTab, {
      character: character as unknown as CharacterData,
      characterId: 'test-char',
      isEditMode,
    }),
  ).replace(/<!-- -->/g, '')
}

// Fixture A: nível 7 com perícias mistas (chaves acentuadas são as de SKILLS)
const fixtureA = {
  level: 7,
  skills: {
    percepção: { distributed: 17, bonus: 0 },
    percepcao: { distributed: 3, bonus: 2 },
    duelo: { distributed: 13, bonus: 7, extra: 'x' },
    salvar: null,
    sobrevivência: { bonus: 5 },
    atuacao: { distributed: 5 },
    ataqueSurpresa: { distributed: 4 },
  },
  adventureKit: [],
  finances: {},
}

// Fixture B: nível 10, só chaves guardadas que não existem em SKILLS (descompasso conhecido)
const fixtureB = {
  level: 10,
  skills: { atuacao: { distributed: 5 }, ataqueSurpresa: { distributed: 4 } },
  adventureKit: [],
  finances: {},
}

beforeEach(() => {
  useUpdateCharacter.mockClear()
  mutateAsync.mockClear()
})

describe('SkillsKitTab: card Perícias', () => {
  for (const isEditMode of [true, false]) {
    it(`fixture A mostra os números do nível 7 (edição ${isEditMode})`, async () => {
      const html = await render(fixtureA, isEditMode)
      expect(html).toContain('80 disponíveis, 30 gastos, 50 restantes')
      expect(html).toContain('aria-label="Percepção, total 19"')
      expect(html).toContain('aria-label="Duelo, total 22"')
      expect(html).toContain('Em uso · 3')
      expect(html).toContain('Todas · 36')
      expect(html).toContain('Combate')
      // O filtro padrão é "Em uso": perícias sem pontos não aparecem
      expect(html).not.toContain('Acrobacia, total')
      expect(mutateAsync).not.toHaveBeenCalled()
    })
  }

  it('fixture B abre em "Todas" e mostra o bônus de nível real', async () => {
    const html = await render(fixtureB, true)
    expect(html).toContain('110 disponíveis, 0 gastos, 110 restantes')
    expect(html).toContain('aria-label="Ataque Surpresa, total 3"')
    expect(html).toContain('aria-label="Atuação, total 3"')
    expect(html).toContain('+ 2 de nível')
    expect(mutateAsync).not.toHaveBeenCalled()
  })
})
