// components/character/basic-info/basic-info-model.ts
// Modelo de exibição da aba Básicos. Sem React: só compõe funções de lib/calculations
// e limita porcentagens para as barras. Não define nenhuma fórmula de jogo.

import {
  calculateVitalityLevels,
  calculateVitalityTotal,
  getBerkanaState,
  getCurrentVitalityStage,
  resolveBerkanaPool,
  resolveCurrentVitalityLevels,
  toVitalityBase,
} from '@/lib/calculations'
import type { CurrentVitalityInput, VitalityBase, VitalityStageKey } from '@/lib/calculations'
import { VITALITY_LEVELS } from '@/lib/constants/character'

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
