import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { CharacterFull } from '@/lib/schemas/character'

// ============================================
// TIPOS DO STORE
// ============================================

interface EditingField {
  section: string
  field: string
  originalValue: any
}

interface CharacterState {
  // Estado do personagem
  character: CharacterFull | null

  // Estado de edição
  editingField: EditingField | null

  // Ações
  setCharacter: (character: CharacterFull) => void

  // Edição inline
  startEditing: (section: string, field: string, currentValue: any) => void
  cancelEditing: () => void

  // Reset
  reset: () => void
}

// ============================================
// STORE PRINCIPAL
// ============================================

export const useCharacterStore = create<CharacterState>()(
  devtools(
    (set, get) => ({
      // ============================================
      // ESTADO INICIAL
      // ============================================
      character: null,
      editingField: null,

      // ============================================
      // AÇÕES BÁSICAS
      // ============================================
      setCharacter: (character) => set({ character }),

      // ============================================
      // EDIÇÃO INLINE
      // ============================================
      startEditing: (section, field, originalValue) => {
        set({
          editingField: { section, field, originalValue }
        })
      },

      cancelEditing: () => {
        const { editingField } = get()
        if (editingField) {
          set({
            editingField: null
          })
        }
      },

      // ============================================
      // RESET
      // ============================================
      reset: () => set({
        character: null,
        editingField: null
      })
    }),
    {
      name: 'character-store'
    }
  )
)

// ============================================
// HOOKS AUXILIARES
// ============================================

/**
 * Hook para verificar se um campo está sendo editado
 */
export const useIsFieldEditing = (section: string, field: string) => {
  return useCharacterStore(state =>
    state.editingField?.section === section &&
    state.editingField?.field === field
  )
}

/**
 * Hook para stats calculados em tempo real
 */
export const useCalculatedStats = () => {
  return useCharacterStore(state => {
    if (!state.character) return null

    const { level, attributes, vitality, skills, berkanaBonus } = state.character

    // Calcular atributos
    const calculatedAttributes: Record<string, number> = {}
    if (attributes) {
      Object.entries(attributes as any).forEach(([key, attr]: [string, any]) => {
        const levelBonus = level >= 5 ? Math.floor(level / 5) : 0
        calculatedAttributes[key] = (attr?.race || 0) + (attr?.class || 0) + (attr?.bonus || 0) + levelBonus
      })
    }

    // Calcular vitalidade
    let calculatedVitality = null
    if (vitality) {
      const vit = vitality as any
      const baseTotal = (vit?.race || 0) + (vit?.class || 0)
      const multiplier = level + 1
      calculatedVitality = {
        notavel: baseTotal * multiplier,
        ferido: (baseTotal - 20) * multiplier,
        gravementeFerido: (baseTotal - 40) * multiplier,
        condenado: (baseTotal - 60) * multiplier,
        incapacitado: (baseTotal - 80) * multiplier,
        coma: (baseTotal - 100) * multiplier
      }
    }

    // Calcular berkana
    const calculatedBerkana = 100 + (level * 10) + berkanaBonus

    // Calcular perícias
    const calculatedSkills: Record<string, number> = {}
    if (skills) {
      Object.entries(skills as any).forEach(([key, skill]: [string, any]) => {
        const levelBonus = Math.floor(level / 5)
        calculatedSkills[key] = 1 + (skill?.distributed || 0) + (skill?.bonus || 0) + levelBonus
      })
    }

    // Calcular pontos de perícia
    const skillPointsAvailable = level * 10
    const skillPointsUsed = skills ? Object.values(skills as any).reduce((total: number, skill: any) =>
      total + (skill?.distributed || 0), 0) : 0
    const skillPointsRemaining = skillPointsAvailable - skillPointsUsed

    return {
      calculatedAttributes,
      calculatedVitality,
      calculatedBerkana,
      calculatedSkills,
      skillPoints: {
        available: skillPointsAvailable,
        used: skillPointsUsed,
        remaining: skillPointsRemaining
      }
    }
  })
}