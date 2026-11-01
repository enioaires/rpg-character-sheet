import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { CharacterFull } from '@/lib/schemas/character'
import {
  calculateAllAttributes,
  calculateAllSkills,
  calculateLevelUpSkillPoints,
  calculateMaxBerkana,
  calculateRemainingSkillPoints,
  calculateUsedSkillPoints,
  calculateVitalityLevels,
  getBaseBerkana,
  toAttributeValue,
  toSkillValue,
  toVitalityBase,
  type AttributeValue,
  type SkillValue,
  type VitalityBase
} from '@/lib/calculations'

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

    const attributeRecord = Object.fromEntries(
      Object.entries(attributes || {}).map(([key, attr]) => [key, toAttributeValue(attr as Partial<AttributeValue> | null)])
    )
    const skillRecord = Object.fromEntries(
      Object.entries(skills || {}).map(([key, skill]) => [key, toSkillValue(skill as Partial<SkillValue> | null)])
    )

    const calculatedAttributes = calculateAllAttributes(attributeRecord, level)
    const calculatedVitality = vitality
      ? calculateVitalityLevels(toVitalityBase(vitality as Partial<VitalityBase>), level)
      : null
    const calculatedBerkana = calculateMaxBerkana(level, getBaseBerkana(), berkanaBonus)
    const calculatedSkills = calculateAllSkills(skillRecord, level)

    const skillPointsAvailable = calculateLevelUpSkillPoints(level)
    const skillPointsUsed = calculateUsedSkillPoints(skillRecord)
    const skillPointsRemaining = calculateRemainingSkillPoints(skillRecord, skillPointsAvailable)

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