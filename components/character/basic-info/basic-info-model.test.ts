// Testes do modelo de exibição da aba Básicos (DS-04).
// O modelo só compõe funções de lib/calculations; aqui se fixam os números exibidos.

import { describe, expect, it } from 'bun:test'
import { calculateAttributeTotal, toAttributeValue } from '@/lib/calculations'
import { ATTRIBUTES, ATTRIBUTE_LABELS, STANDARD_LANGUAGES } from '@/lib/constants/character'
import {
  buildAttributeRows,
  buildBerkanaView,
  buildExperienceView,
  buildLanguageChips,
  buildVitalityView,
  getFillPercent,
  hasWeaponContent,
} from './basic-info-model'

// ============================================
// getFillPercent
// ============================================

describe('getFillPercent', () => {
  it('calcula a porcentagem e limita entre 0 e 100', () => {
    expect(getFillPercent(50, 100)).toBe(50)
    expect(getFillPercent(0, 100)).toBe(0)
    expect(getFillPercent(150, 100)).toBe(100)
    expect(getFillPercent(-5, 100)).toBe(0)
  })

  it('máximo zero, negativo ou valor não finito dá 0', () => {
    expect(getFillPercent(5, 0)).toBe(0)
    expect(getFillPercent(5, -10)).toBe(0)
    expect(getFillPercent(NaN, 100)).toBe(0)
    expect(getFillPercent(5, Infinity)).toBe(0)
  })
})

// ============================================
// buildVitalityView
// ============================================

describe('buildVitalityView', () => {
  const input = {
    level: 7,
    vitality: { race: 200, class: 250 },
    currentVitality: { notavel: 0, ferido: 1000 },
  }

  it('máximo = raça + classe + por nível × nível; chaves antigas ignoradas dão vida cheia', () => {
    const view = buildVitalityView(input)

    expect(view.max).toBe(5350)
    expect(view.current).toBe(5350)
    expect(view.percent).toBe(100)
    expect(view.isConfigured).toBe(true)
    expect(view.base).toEqual({ race: 200, class: 250, perLevel: 700 })
  })

  it('atual gravado entra no percentual', () => {
    const view = buildVitalityView({ ...input, currentVitality: { ...input.currentVitality, current: 1070 } })

    expect(view.current).toBe(1070)
    expect(view.percent).toBe(20)
  })

  it('por nível gravado substitui o padrão', () => {
    const view = buildVitalityView({ ...input, vitality: { race: 200, class: 250, perLevel: 0 } })

    expect(view.max).toBe(450)
    expect(view.base.perLevel).toBe(0)
  })

  it('vitalidade não configurada: máximo 0, não configurada, 0%', () => {
    const view = buildVitalityView({ level: 0, vitality: { race: 0, class: 0 }, currentVitality: {} })

    expect(view.max).toBe(0)
    expect(view.isConfigured).toBe(false)
    expect(view.percent).toBe(0)
  })

  it('entradas todas indefinidas não lançam', () => {
    expect(() => buildVitalityView({ level: undefined, vitality: undefined, currentVitality: undefined })).not.toThrow()
    expect(buildVitalityView({}).isConfigured).toBe(false)
  })
})

// ============================================
// buildBerkanaView
// ============================================

describe('buildBerkanaView', () => {
  it('metade: atual 85 de 170, bônus 15', () => {
    const view = buildBerkanaView({ level: 7, maxBerkana: 170, currentBerkana: 85, berkanaBonus: 15 })
    expect(view.current).toBe(85)
    expect(view.max).toBe(170)
    expect(view.bonus).toBe(15)
    expect(view.state).toBe('metade')
    expect(view.percent).toBe(50)
  })

  it('máximo gravado 0 usa o calculado; atual acima do máximo fica cheia e limitada a 100%', () => {
    const view = buildBerkanaView({ level: 7, maxBerkana: 0, currentBerkana: 200, berkanaBonus: 15 })
    expect(view.max).toBe(185)
    expect(view.state).toBe('cheia')
    expect(view.percent).toBe(100)
  })

  it('personagem vazio usa os padrões do card: 100 / 100, bônus 0', () => {
    const view = buildBerkanaView({})
    expect(view.current).toBe(100)
    expect(view.max).toBe(100)
    expect(view.bonus).toBe(0)
    expect(view.state).toBe('cheia')
  })
})

// ============================================
// buildAttributeRows
// ============================================

describe('buildAttributeRows', () => {
  it('14 linhas na ordem de ATTRIBUTES, com total incluindo o bônus de nível', () => {
    const rows = buildAttributeRows({ agilidade: { race: 8, class: 6, bonus: 1 } }, 7)

    expect(rows).toHaveLength(14)
    expect(rows.map((row) => row.key)).toEqual([...ATTRIBUTES])
    expect(rows[0].label).toBe(ATTRIBUTE_LABELS.agilidade)
    expect(rows[0]).toMatchObject({ race: 8, class: 6, bonus: 1, levelBonus: 1, total: 16 })

    const carisma = rows.find((row) => row.key === 'carisma')
    expect(carisma).toMatchObject({ race: 0, class: 0, bonus: 0, levelBonus: 1, total: 1 })
  })

  it('cada total é igual à expressão congelada do card de resumo original', () => {
    // Cópia da expressão do commit-base (registrado no Passo 0 da tarefa 1); nunca editar.
    const frozenTotal = (attributes: Record<string, Partial<{ race: number; class: number; bonus: number }>>, key: string, level: number) => {
      const attr = attributes[key] || { race: 0, class: 0, bonus: 0 }
      return calculateAttributeTotal(toAttributeValue(attr), level || 0)
    }
    const attributes = {
      agilidade: { race: 8, class: 6, bonus: 1 },
      força: { race: 12, class: 3 },
      vigor: { race: NaN, class: 4, bonus: 2 },
    }

    for (const level of [0, 4, 5, 7, 10, 99]) {
      const rows = buildAttributeRows(attributes, level)
      for (const row of rows) {
        expect(row.total).toBe(frozenTotal(attributes, row.key, level))
      }
    }
  })

  it('sem dados devolve 14 linhas zeradas e não lança', () => {
    const rows = buildAttributeRows(undefined, undefined)
    expect(rows).toHaveLength(14)
    for (const row of rows) {
      expect(row).toMatchObject({ race: 0, class: 0, bonus: 0, levelBonus: 0, total: 0 })
    }
  })
})

// ============================================
// buildExperienceView
// ============================================

describe('buildExperienceView', () => {
  it('nível 7 com 57 XP: faltam 23 para o nível 8', () => {
    expect(buildExperienceView(7, 57)).toEqual({
      level: 7,
      xp: 57,
      required: 80,
      remaining: 23,
      percent: 71.25,
      caption: 'Faltam 23 XP para o nível 8',
    })
  })

  it('XP suficiente (canLevelUp) mostra a legenda de subida e 100%', () => {
    const view = buildExperienceView(7, 80)
    expect(view.caption).toBe('XP suficiente para o nível 8')
    expect(view.percent).toBe(100)
    expect(buildExperienceView(7, 200).percent).toBe(100)
  })

  it('sem dados: nível 0, 10 XP necessários', () => {
    const view = buildExperienceView(undefined, undefined)
    expect(view.required).toBe(10)
    expect(view.caption).toBe('Faltam 10 XP para o nível 1')
    expect(view.percent).toBe(0)
  })

  it('nível 99 mostra "Nível máximo"', () => {
    expect(buildExperienceView(99, 5000).caption).toBe('Nível máximo')
  })
})

// ============================================
// hasWeaponContent
// ============================================

describe('hasWeaponContent', () => {
  it('valores vazios ou que não são objeto dão false', () => {
    expect(hasWeaponContent(null)).toBe(false)
    expect(hasWeaponContent('x')).toBe(false)
    expect(hasWeaponContent({})).toBe(false)
    expect(hasWeaponContent({ name: '', level: 0 })).toBe(false)
  })

  it('nome, dano, descrição ou nível dão true', () => {
    expect(hasWeaponContent({ name: 'Adaga' })).toBe(true)
    expect(hasWeaponContent({ damage: { critical: '7000' } })).toBe(true)
    expect(hasWeaponContent({ description: 'x' })).toBe(true)
    expect(hasWeaponContent({ level: 3 })).toBe(true)
  })
})

// ============================================
// buildLanguageChips
// ============================================

describe('buildLanguageChips', () => {
  it('seis padrões na ordem com rótulos acentuados e custom por índice de armazenamento', () => {
    const chips = buildLanguageChips({
      standard: { comum: true },
      custom: [
        { name: 'Malashin', known: true },
        { name: '', known: false },
      ],
    })

    expect(chips.standard.map((chip) => chip.key)).toEqual([...STANDARD_LANGUAGES])
    expect(chips.standard.map((chip) => chip.label)).toEqual([
      'Comum',
      'Errante',
      'Élfico',
      'Sombrio',
      'Anão',
      'Sigílico',
    ])
    expect(chips.standard[0].known).toBe(true)
    expect(chips.standard.slice(1).every((chip) => !chip.known)).toBe(true)
    expect(chips.custom).toEqual([
      { index: 0, name: 'Malashin', known: true },
      { index: 1, name: '', known: false },
    ])
  })

  it('custom como objeto indexado (DS4-19) não aparece, igual a hoje', () => {
    const chips = buildLanguageChips({ custom: { '0': { name: 'X' } } })
    expect(chips.custom).toEqual([])
  })

  it('buraco nulo no array mantém o índice de armazenamento das seguintes', () => {
    const chips = buildLanguageChips({ custom: [null, { name: 'B', known: true }] })
    expect(chips.custom).toEqual([{ index: 1, name: 'B', known: true }])
  })

  it('sem dados: 6 padrões e 0 custom', () => {
    const chips = buildLanguageChips(undefined)
    expect(chips.standard).toHaveLength(6)
    expect(chips.custom).toHaveLength(0)
  })
})
