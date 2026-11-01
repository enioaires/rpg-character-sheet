'use client'

import { createContext, useContext } from 'react'

export type QuickSheetKind = 'vit' | 'berk' | 'arma' | 'atributos' | 'pericias'

export interface QuickSheetApi {
  openSheet: (kind: QuickSheetKind) => void
}

// O CharacterLayout provê este contexto ao redor de todas as abas e da barra
export const QuickSheetContext = createContext<QuickSheetApi | null>(null)

export function useQuickSheet(): QuickSheetApi {
  const api = useContext(QuickSheetContext)
  if (!api) {
    throw new Error('useQuickSheet must be used inside CharacterLayout')
  }
  return api
}
