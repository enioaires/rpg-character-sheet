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
  isLoading: boolean
  error: string | null

  // Estado de edição
  editingField: EditingField | null
  pendingChanges: Record<string, any>
  isSaving: boolean

  // Ações
  setCharacter: (character: CharacterFull) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Edição inline
  startEditing: (section: string, field: string, currentValue: any) => void
  cancelEditing: () => void
  updateField: (value: any) => void
  saveField: () => Promise<void>

  // Mudanças em lote
  addPendingChange: (field: string, value: any) => void
  savePendingChanges: () => Promise<void>
  clearPendingChanges: () => void

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
      isLoading: false,
      error: null,
      editingField: null,
      pendingChanges: {},
      isSaving: false,

      // ============================================
      // AÇÕES BÁSICAS
      // ============================================
      setCharacter: (character) => set({ character, error: null }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      // ============================================
      // EDIÇÃO INLINE
      // ============================================
      startEditing: (section, field, originalValue) => {
        set({
          editingField: { section, field, originalValue },
          error: null
        })
      },

      cancelEditing: () => {
        const { editingField } = get()
        if (editingField) {
          // Restaurar valor original se necessário
          set({
            editingField: null,
            error: null
          })
        }
      },

      updateField: (value) => {
        const { editingField, character } = get()
        if (!editingField || !character) return

        // Atualizar valor temporariamente no personagem
        const updatedCharacter = { ...character }

        // Navegação aninhada para campos como attributes.agilidade.race
        const fieldPath = editingField.field.split('.')
        let current = updatedCharacter as any

        for (let i = 0; i < fieldPath.length - 1; i++) {
          if (!current[fieldPath[i]]) current[fieldPath[i]] = {}
          current = current[fieldPath[i]]
        }

        current[fieldPath[fieldPath.length - 1]] = value

        set({ character: updatedCharacter })
      },

      saveField: async () => {
        const { editingField, character } = get()
        if (!editingField || !character) return

        set({ isSaving: true, error: null })

        try {
          // Aqui integraremos com as APIs de update
          // Por enquanto, vamos simular
          await new Promise(resolve => setTimeout(resolve, 500))

          // Sucesso - limpar estado de edição
          set({
            editingField: null,
            isSaving: false
          })
        } catch (error) {
          // Erro - restaurar valor original e mostrar erro
          const { editingField: currentEditingField } = get()
          if (currentEditingField) {
            // Restaurar valor original
            get().updateField(currentEditingField.originalValue)

            set({
              error: error instanceof Error ? error.message : 'Erro ao salvar',
              isSaving: false
            })
          }
        }
      },

      // ============================================
      // MUDANÇAS EM LOTE
      // ============================================
      addPendingChange: (field, value) => {
        const { pendingChanges } = get()
        set({
          pendingChanges: {
            ...pendingChanges,
            [field]: value
          }
        })
      },

      savePendingChanges: async () => {
        const { pendingChanges, character } = get()
        if (!character || Object.keys(pendingChanges).length === 0) return

        set({ isSaving: true, error: null })

        try {
          // Aqui integraremos com a API de update em lote
          await new Promise(resolve => setTimeout(resolve, 1000))

          set({
            pendingChanges: {},
            isSaving: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao salvar mudanças',
            isSaving: false
          })
        }
      },

      clearPendingChanges: () => set({ pendingChanges: {} }),

      // ============================================
      // RESET
      // ============================================
      reset: () => set({
        character: null,
        isLoading: false,
        error: null,
        editingField: null,
        pendingChanges: {},
        isSaving: false
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
 * Hook para verificar se há mudanças pendentes
 */
export const useHasPendingChanges = () => {
  return useCharacterStore(state =>
    Object.keys(state.pendingChanges).length > 0
  )
}

/**
 * Hook para obter valor de um campo específico
 */
export const useFieldValue = (fieldPath: string) => {
  return useCharacterStore(state => {
    if (!state.character) return null

    const path = fieldPath.split('.')
    let current = state.character as any

    for (const key of path) {
      if (current == null) return null
      current = current[key]
    }

    return current
  })
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