// Testes do modelo de exibição da aba Básicos (DS-04).
// O modelo só compõe funções de lib/calculations; aqui se fixam os números exibidos.

import { describe, expect, it } from 'bun:test'
import {
  calculateVitalityLevels,
  calculateVitalityTotal,
  resolveCurrentVitalityLevels,
  toVitalityBase,
} from '@/lib/calculations'
import { VITALITY_LEVELS } from '@/lib/constants/character'
import { buildBerkanaView, buildVitalityView, getFillPercent } from './basic-info-model'

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

  it('totais, estágio e posição vêm dos helpers de lib/calculations', () => {
    const view = buildVitalityView(input)
    const maxLevels = calculateVitalityLevels(toVitalityBase(input.vitality), 7)
    const current = resolveCurrentVitalityLevels(input.currentVitality, maxLevels)

    expect(view.maxTotal).toBe(19200)
    expect(view.currentTotal).toBe(13160)
    expect(view.maxTotal).toBe(calculateVitalityTotal(maxLevels))
    expect(view.currentTotal).toBe(calculateVitalityTotal(current))
    expect(view.stage).toBe('ferido')
    expect(view.stagePosition).toBe(2)
  })

  it('seis linhas na ordem de VITALITY_LEVELS, com a atual marcada', () => {
    const view = buildVitalityView(input)
    const maxLevels = calculateVitalityLevels(toVitalityBase(input.vitality), 7)
    const current = resolveCurrentVitalityLevels(input.currentVitality, maxLevels)

    expect(view.rows.map((row) => row.key)).toEqual([...VITALITY_LEVELS])
    for (const row of view.rows) {
      expect(row.current).toBe(current[row.key])
    }

    const ferido = view.rows[1]
    expect(ferido.current).toBe(1000)
    expect(ferido.max).toBe(3440)
    expect(ferido.isCurrent).toBe(true)

    const notavel = view.rows[0]
    expect(notavel.percent).toBe(0)
    expect(notavel.isCurrent).toBe(false)

    const grave = view.rows[2]
    expect(grave.current).toBe(3280)
    expect(grave.max).toBe(3280)
    expect(grave.percent).toBe(100)
  })

  it('vitalidade não configurada: sem estágio, sem posição, tudo 0%', () => {
    const view = buildVitalityView({ level: 0, vitality: { race: 0, class: 0 }, currentVitality: {} })
    expect(view.stage).toBeNull()
    expect(view.stagePosition).toBeNull()
    for (const row of view.rows) {
      expect(row.percent).toBe(0)
      expect(row.isCurrent).toBe(false)
    }
  })

  it('entradas todas indefinidas não lançam', () => {
    expect(() => buildVitalityView({ level: undefined, vitality: undefined, currentVitality: undefined })).not.toThrow()
    expect(buildVitalityView({}).stage).toBeNull()
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
