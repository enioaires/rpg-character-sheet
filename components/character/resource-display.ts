// components/character/resource-display.ts
// Mapa de exibição dos recursos em jogo (vitalidade e Berkana) e formatador de números.
// Sem JSX e sem 'use client': pode ser importado de qualquer lugar.

import { Droplets, Heart, HeartCrack, Link, Moon, Skull } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { VITALITY_LABELS } from '@/lib/constants/character'
import type { VitalityStageKey } from '@/lib/calculations'

export type VitalityStageDisplay = {
  label: string
  shortLabel: string
  Icon: LucideIcon
  textClassName: string
  bgClassName: string
  borderClassName: string
}

// Classes literais para o Tailwind enxergar cada utilitário. gravementeFerido usa os tokens 'grave'.
export const VITALITY_STAGE_DISPLAY: Record<VitalityStageKey, VitalityStageDisplay> = {
  notavel: {
    label: VITALITY_LABELS.notavel,
    shortLabel: VITALITY_LABELS.notavel,
    Icon: Heart,
    textClassName: 'text-vitality-notavel',
    bgClassName: 'bg-vitality-notavel',
    borderClassName: 'border-vitality-notavel',
  },
  ferido: {
    label: VITALITY_LABELS.ferido,
    shortLabel: VITALITY_LABELS.ferido,
    Icon: HeartCrack,
    textClassName: 'text-vitality-ferido',
    bgClassName: 'bg-vitality-ferido',
    borderClassName: 'border-vitality-ferido',
  },
  gravementeFerido: {
    label: VITALITY_LABELS.gravementeFerido,
    shortLabel: 'Grav. Ferido',
    Icon: Droplets,
    textClassName: 'text-vitality-grave',
    bgClassName: 'bg-vitality-grave',
    borderClassName: 'border-vitality-grave',
  },
  condenado: {
    label: VITALITY_LABELS.condenado,
    shortLabel: VITALITY_LABELS.condenado,
    Icon: Skull,
    textClassName: 'text-vitality-condenado',
    bgClassName: 'bg-vitality-condenado',
    borderClassName: 'border-vitality-condenado',
  },
  incapacitado: {
    label: VITALITY_LABELS.incapacitado,
    shortLabel: VITALITY_LABELS.incapacitado,
    Icon: Link,
    textClassName: 'text-vitality-incapacitado',
    bgClassName: 'bg-vitality-incapacitado',
    borderClassName: 'border-vitality-incapacitado',
  },
  coma: {
    label: VITALITY_LABELS.coma,
    shortLabel: VITALITY_LABELS.coma,
    Icon: Moon,
    textClassName: 'text-vitality-coma',
    bgClassName: 'bg-vitality-coma',
    borderClassName: 'border-vitality-coma',
  },
}

const GAME_NUMBER_FORMAT = new Intl.NumberFormat('pt-BR')

// Só para exibição ("13.160"); os valores gravados nunca passam por aqui
export function formatGameNumber(value: number): string {
  return Number.isFinite(value) ? GAME_NUMBER_FORMAT.format(value) : '0'
}
