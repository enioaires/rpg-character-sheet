// components/character/basic-info/basic-info-model.ts
// Modelo de exibição da aba Básicos. Sem React: só compõe funções de lib/calculations
// e limita porcentagens para as barras. Não define nenhuma fórmula de jogo.

import {
  calculateAttributeTotal,
  calculateVitalityLevels,
  calculateVitalityTotal,
  canLevelUp,
  getAttributeLevelBonus,
  getBerkanaState,
  getCurrentVitalityStage,
  getXPRequiredForNextLevel,
  resolveBerkanaPool,
  resolveCurrentVitalityLevels,
  toAttributeValue,
  toVitalityBase,
} from '@/lib/calculations'
import type { AttributeValue, CurrentVitalityInput, VitalityBase, VitalityStageKey } from '@/lib/calculations'
import { ATTRIBUTES, ATTRIBUTE_LABELS, VITALITY_LEVELS } from '@/lib/constants/character'

// ============================================
// BARRAS
// ============================================

/**
 * Porcentagem de preenchimento de uma barra, limitada a 0-100.
 * Só para exibição: máximo <= 0 ou valores não finitos dão 0.
 */
export function getFillPercent(current: number, max: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(max) || max <= 0) return 0
  return Math.min(100, Math.max(0, (current / max) * 100))
}

// ============================================
// VITALIDADE
// ============================================

export interface VitalityRowView {
  key: VitalityStageKey
  current: number
  max: number
  percent: number
  isCurrent: boolean
}

interface VitalityViewInput {
  level?: number | null
  vitality?: Partial<VitalityBase> | null
  currentVitality?: CurrentVitalityInput
}

export function buildVitalityView({ level, vitality, currentVitality }: VitalityViewInput) {
  const maxLevels = calculateVitalityLevels(toVitalityBase(vitality), level || 0)
  const current = resolveCurrentVitalityLevels(currentVitality, maxLevels)
  const stage = getCurrentVitalityStage(current, maxLevels)

  const rows: VitalityRowView[] = VITALITY_LEVELS.map((key) => ({
    key,
    current: current[key],
    max: maxLevels[key],
    percent: getFillPercent(current[key], maxLevels[key]),
    isCurrent: key === stage,
  }))

  return {
    maxLevels,
    current,
    currentTotal: calculateVitalityTotal(current),
    maxTotal: calculateVitalityTotal(maxLevels),
    stage,
    stagePosition: stage ? VITALITY_LEVELS.indexOf(stage) + 1 : null,
    rows,
  }
}

// ============================================
// BERKANA
// ============================================

export function buildBerkanaView(character: Parameters<typeof resolveBerkanaPool>[0] & { berkanaBonus?: number | null }) {
  const pool = resolveBerkanaPool(character)
  // Mesmo padrão do card: só undefined vira 0
  const { berkanaBonus: bonus = 0 } = character

  return {
    current: pool.current,
    max: pool.max,
    bonus,
    state: getBerkanaState(pool.current, pool.max),
    percent: getFillPercent(pool.current, pool.max),
  }
}

// ============================================
// ATRIBUTOS
// ============================================

export interface AttributeRowView {
  key: (typeof ATTRIBUTES)[number]
  label: string
  race: number
  class: number
  bonus: number
  levelBonus: number
  total: number
}

type AttributesInput = Record<string, Partial<AttributeValue> | null | undefined> | null | undefined

/**
 * Uma linha por atributo, na ordem de ATTRIBUTES. O total inclui o bônus de nível
 * (calculateAttributeTotal), o mesmo número da sheet de Atributos.
 */
export function buildAttributeRows(attributes: AttributesInput, level: number | null | undefined): AttributeRowView[] {
  return ATTRIBUTES.map((key) => {
    const attr = attributes?.[key] || { race: 0, class: 0, bonus: 0 }

    return {
      key,
      label: ATTRIBUTE_LABELS[key],
      race: attr.race || 0,
      class: attr.class || 0,
      bonus: attr.bonus || 0,
      levelBonus: getAttributeLevelBonus(level || 0),
      total: calculateAttributeTotal(toAttributeValue(attr), level || 0),
    }
  })
}

// ============================================
// EXPERIÊNCIA
// ============================================

const MAX_LEVEL = 99

/**
 * XP gravado é o XP dentro do nível atual (processLevelUp desconta o XP usado).
 * Legenda: nível máximo, XP suficiente (canLevelUp) ou quanto falta.
 */
export function buildExperienceView(level: number | null | undefined, currentXP: number | null | undefined) {
  const lvl = level || 0
  const xp = currentXP || 0
  const required = getXPRequiredForNextLevel(lvl)
  const remaining = Math.max(0, required - xp)

  let caption = `Faltam ${remaining} XP para o nível ${lvl + 1}`
  if (lvl >= MAX_LEVEL) {
    caption = 'Nível máximo'
  } else if (canLevelUp(xp, lvl)) {
    caption = `XP suficiente para o nível ${lvl + 1}`
  }

  return { level: lvl, xp, required, remaining, percent: getFillPercent(xp, required), caption }
}
