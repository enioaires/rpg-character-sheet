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

// ============================================
// Finanças e Kit
// ============================================

const fixtureKit = {
  ...fixtureA,
  finances: { ouro: 100 },
  adventureKit: [
    { name: 'Cantil 3 Litros', quantity: 1, isDefault: true },
    { name: 'Espelho', quantity: 1, isDefault: true },
    { name: 'Lamparina de Cinto', quantity: 1, isDefault: false },
  ],
}

describe('SkillsKitTab: Finanças e Kit', () => {
  it('desbloqueado: Finanças, personalizados antes dos padrão e kit recolhido', async () => {
    const html = await render(fixtureKit, true)
    expect(html).toContain('data-section="finances"')
    expect(html).toContain('Joias')
    expect(html).toContain('Personalizados · 1')
    expect(html).toContain('Itens padrão · 2')
    expect(html).toContain('Adicionar item')
    expect(html.indexOf('Lamparina de Cinto')).toBeGreaterThan(-1)
    expect(html.indexOf('Lamparina de Cinto')).toBeLessThan(html.indexOf('Itens padrão · 2'))
    // Itens padrão começam recolhidos
    expect(html).not.toContain('Cantil 3 Litros')
    expect(html).toContain('Remover Lamparina de Cinto')
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('bloqueado esconde os controles só de edição', async () => {
    const html = await render(fixtureKit, false)
    expect(html).not.toContain('Adicionar item')
    expect(html).not.toContain('Remover Lamparina')
    expect(html).toContain('Lamparina de Cinto')
    expect(html).toContain('Itens padrão · 2')
  })

  it('kit vazio mostra o texto de lista vazia', async () => {
    const html = await render({ ...fixtureA, adventureKit: [] }, true)
    expect(html).toContain('Nenhum item no kit')
  })
})

// ============================================
// SkillRow isolado
// ============================================

async function renderRow(options: {
  isOpen: boolean
  isEditMode: boolean
  isStepDisabled?: boolean
}): Promise<string> {
  const { SkillRow } = await import('./skills-kit/skill-row')
  const { buildSkillRow } = await import('./skills-kit/skills-kit-model')
  const row = buildSkillRow(fixtureA.skills, 'percepção', 7)
  return renderToString(
    createElement(SkillRow, {
      row,
      isOpen: options.isOpen,
      onToggle: () => {},
      levelBonus: 1,
      isEditMode: options.isEditMode,
      characterId: 'test-char',
      character: fixtureA as unknown as CharacterData,
      isStepDisabled: options.isStepDisabled ?? false,
      onStep: async () => {},
    }),
  ).replace(/<!-- -->/g, '')
}

// O botão com o aria-label informado está desabilitado? (a classe também contém "disabled:")
function isButtonDisabled(html: string, ariaLabel: string): boolean {
  const match = html.match(new RegExp(`<button[^>]*aria-label="${ariaLabel}"[^>]*>`))
  return match ? / disabled=""/.test(match[0]) : false
}

describe('SkillRow', () => {
  it('aberta e desbloqueada mostra os steppers, com "Diminuir bônus" travado em 0', async () => {
    const html = await renderRow({ isOpen: true, isEditMode: true })
    expect(html).toContain('aria-label="Aumentar distribuídos de Percepção"')
    expect(html).toContain('aria-label="Diminuir bônus de Percepção"')
    expect(html).toContain('aria-expanded="true"')
    expect(isButtonDisabled(html, 'Diminuir bônus de Percepção')).toBe(true)
    expect(isButtonDisabled(html, 'Diminuir distribuídos de Percepção')).toBe(false)
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('aberta e bloqueada mostra só os valores, sem botões de passo', async () => {
    const html = await renderRow({ isOpen: true, isEditMode: false })
    expect(html).not.toContain('Aumentar')
    expect(html).not.toContain('Diminuir')
    expect(html).toContain('17')
    expect(html).toContain('Base 1 · Nível +1')
  })

  it('fechada não renderiza o detalhe', async () => {
    const html = await renderRow({ isOpen: false, isEditMode: true })
    expect(html).not.toContain('id="skill-detail-percepção"')
    expect(html).toContain('aria-expanded="false"')
  })

  it('com a mutação pendente os botões "Aumentar" ficam desabilitados', async () => {
    const html = await renderRow({ isOpen: true, isEditMode: true, isStepDisabled: true })
    expect(isButtonDisabled(html, 'Aumentar distribuídos de Percepção')).toBe(true)
    expect(isButtonDisabled(html, 'Aumentar bônus de Percepção')).toBe(true)
  })
})
