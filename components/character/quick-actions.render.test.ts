// Testes de render da barra de ações rápidas e dos corpos das sheets de consulta (DS-03).
//
// renderToString não executa efeitos nem eventos: aqui só se verifica o que a
// barra e as sheets de consulta mostram. As gravações (Dano, Cura, Gastar...) são
// provadas pelos testes de lib/calculations. Os corpos das sheets são testados sem
// portal porque o BottomSheet (Radix) só monta o conteúdo no navegador.

import { describe, expect, it } from 'bun:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { QuickActionsBar } from './quick-actions-bar'
import {
  AttributesSheetBody,
  SkillsSheetBody,
  WeaponsSheetBody,
} from './quick-sheets/reference-sheets'
import {
  calculateAttributeBase,
  calculateSkillTotal,
  toAttributeValue,
  toSkillValue,
} from '@/lib/calculations'
import { SKILLS, SKILL_LABELS } from '@/lib/constants/character'
import { formatGameNumber } from './resource-display'
import type { CharacterData } from './types'

// renderToString separa nós de texto adjacentes com comentários; removemos para comparar o texto
const html = (element: Parameters<typeof renderToString>[0]) =>
  renderToString(element).replace(/<!-- -->/g, '')

const noop = () => {}

// O personagem chega à barra já sanitizado pela página: currentVitality é sempre um objeto
function barCharacter(overrides: Record<string, unknown>): CharacterData {
  return {
    level: 7,
    vitality: { race: 200, class: 250 },
    currentVitality: { notavel: 0, ferido: 1000 },
    maxBerkana: 170,
    currentBerkana: 0,
    berkanaBonus: 0,
    ...overrides,
  } as unknown as CharacterData
}

const renderBar = (character: CharacterData, isEditMode: boolean) =>
  html(createElement(QuickActionsBar, { character, isEditMode, onToggleEditMode: noop, onOpenSheet: noop }))

// ============================================
// BARRA
// ============================================

describe('QuickActionsBar', () => {
  it('mostra vitalidade atual, nível, Berkana esgotada e as ações (desbloqueada)', () => {
    const out = renderBar(barCharacter({}), true)

    // ferido 1000 + os outros níveis no máximo (fallback por nível dentro do objeto)
    expect(out).toContain(formatGameNumber(13160))
    expect(out).toContain('13.160')
    expect(out).toContain('Ferido')
    expect(out).toContain('text-vitality-ferido')

    // DB-07: Berkana gravada em 0 aparece como 0 e Esgotada (não volta ao máximo)
    expect(out).toContain('170')
    expect(out).toContain('lucide-circle-off')

    for (const label of ['Armas', 'Perícias', 'Atributos', 'Desbloqueado']) {
      expect(out).toContain(label)
    }
    expect(out).toContain('aria-pressed="false"')
  })

  it('bloqueada mostra "Bloqueado" e aria-pressed true', () => {
    const out = renderBar(barCharacter({}), false)
    expect(out).toContain('Bloqueado')
    expect(out).not.toContain('Desbloqueado')
    expect(out).toContain('aria-pressed="true"')
  })

  it('não usa cores fixas da paleta do Tailwind', () => {
    const out = renderBar(barCharacter({}), true)
    expect(out).not.toMatch(/(?:text|bg|border)-(?:red|green|yellow|orange|blue|amber|lime|emerald|slate|gray|zinc|neutral|stone)-\d/)
  })

  it('vitalidade 0/0 com currentVitality zerado mostra o rótulo neutro e nenhum nível Coma', () => {
    const out = renderBar(
      barCharacter({
        vitality: { race: 0, class: 0 },
        level: 0,
        currentVitality: { notavel: 0, ferido: 0, gravementeFerido: 0, condenado: 0, incapacitado: 0, coma: 0 },
      }),
      true
    )
    expect(out).toContain('Vitalidade')
    expect(out).not.toContain('text-vitality-coma')
  })
})

// ============================================
// SHEETS DE CONSULTA
// ============================================

describe('SkillsSheetBody', () => {
  const skills = {
    duelo: { distributed: 13, bonus: 7 },
    percepção: { distributed: 17, bonus: 0 },
  }

  it('mostra só as perícias em uso, com o total de calculateSkillTotal', () => {
    const out = html(createElement(SkillsSheetBody, { skills, level: 7 } as never))
    const duelo = calculateSkillTotal(toSkillValue(skills.duelo), 7)
    const percepcao = calculateSkillTotal(toSkillValue(skills.percepção), 7)

    expect(duelo).toBe(22)
    expect(percepcao).toBe(19)
    expect(out).toContain('Duelo')
    expect(out).toContain(`>${duelo}<`)
    expect(out).toContain('Percepção')
    expect(out).toContain(`>${percepcao}<`)
    expect(out).not.toContain('Acrobacia')
  })

  it('legenda e filtros: "as outras valem 2", "Em uso · 2" e "Todas · 36"', () => {
    const out = html(createElement(SkillsSheetBody, { skills, level: 7 } as never))
    const others = calculateSkillTotal(toSkillValue(undefined), 7)

    expect(others).toBe(2)
    expect(out).toContain(`Em uso · as outras valem ${others}`)
    expect(out).toContain('Em uso · 2')
    expect(out).toContain(`Todas · ${SKILLS.length}`)
    expect(SKILLS.length).toBe(36)
  })

  it('sem perícias em uso mostra todas as 36, na ordem de SKILLS', () => {
    const out = html(createElement(SkillsSheetBody, { skills: {}, level: 7 } as never))
    const first = SKILL_LABELS[SKILLS[0]]
    const last = SKILL_LABELS[SKILLS[SKILLS.length - 1]]

    expect(out).toContain('Todas as perícias')
    expect(out).toContain(first)
    expect(out).toContain(last)
    expect(out.indexOf(first)).toBeLessThan(out.indexOf(last))
    for (const key of SKILLS) {
      expect(out).toContain(SKILL_LABELS[key])
    }
  })
})

describe('AttributesSheetBody', () => {
  it('mostra calculateAttributeBase (sem bônus de nível) e 0 para atributo sem dados', () => {
    const attributes = { agilidade: { race: 8, class: 6, bonus: 1 } }
    const out = html(createElement(AttributesSheetBody, { attributes } as never))

    expect(calculateAttributeBase(toAttributeValue(attributes.agilidade))).toBe(15)
    expect(out).toContain('Agilidade')
    expect(out).toContain('>15<')
    expect(out).toContain('Carisma')
    expect(out).toContain('>0<')
  })
})

describe('WeaponsSheetBody', () => {
  it('mostra nome, nível, danos e travessão nas células vazias; ignora entradas nulas', () => {
    const weapons = [
      { name: 'Espada Longa', level: 37, damage: { d25: '3000', critical: '7000' } },
      null,
      { name: 'Adaga' },
    ]
    const out = html(createElement(WeaponsSheetBody, { weapons }))

    expect(out).toContain('Espada Longa')
    expect(out).toContain('Nv 37')
    expect(out).toContain('3000')
    expect(out).toContain('7000')
    expect(out).toContain('Adaga')
    expect(out).toContain('—')
  })

  it('lista vazia mostra a mensagem de estado vazio', () => {
    const out = html(createElement(WeaponsSheetBody, { weapons: [] }))
    expect(out).toContain('Nenhuma arma cadastrada')
  })
})
