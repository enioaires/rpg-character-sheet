// components/character/resource-display.ts
// Mapa de exibição da Berkana e formatador de números.
// Sem JSX e sem 'use client': pode ser importado de qualquer lugar.

import { CircleOff, Sparkle, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { BerkanaStateKey } from '@/lib/calculations'

export const BERKANA_STATE_DISPLAY: Record<BerkanaStateKey, { label: string; Icon: LucideIcon }> = {
  cheia: { label: 'Cheia', Icon: Sparkles },
  metade: { label: 'Pela metade', Icon: Sparkle },
  esgotada: { label: 'Esgotada', Icon: CircleOff },
  disponivel: { label: 'Disponível', Icon: Sparkles },
}

const GAME_NUMBER_FORMAT = new Intl.NumberFormat('pt-BR')

// Só para exibição ("13.160"); os valores gravados nunca passam por aqui
export function formatGameNumber(value: number): string {
  return Number.isFinite(value) ? GAME_NUMBER_FORMAT.format(value) : '0'
}
