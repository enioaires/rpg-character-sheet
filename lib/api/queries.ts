import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { GetCharactersQuery, CreateCharacterRequest, UpdateCharacterRequest } from '@/lib/schemas/character'
import type {
  LevelUpRequest,
  CalculateVitalityRequest,
  CalculateBerkanaRequest,
  ValidateSkillsRequest,
  CalculateAttributesRequest,
  CalculateXPRequest,
  CalculateSkillPointsRequest,
  RecalculateCharacterRequest
} from '@/lib/schemas/calculations'
import { useMemo } from 'react'

export const useCharacters = (params?: GetCharactersQuery) => {
  return useQuery({
    queryKey: ['characters', params],
    queryFn: async () => {
      const response = await api.characters.$get({
        query: {
          page: params?.page?.toString() || undefined,
          limit: params?.limit?.toString() || undefined,
          search: params?.search || undefined,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch characters')
      }

      return await response.json()
    },
  })
}

export const useCharacter = (id: string) => {
  return useQuery({
    queryKey: ['character', id],
    queryFn: async () => {
      const response = await api.characters[':id'].$get({
        param: { id }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Character not found')
        }
        throw new Error('Failed to fetch character')
      }

      return await response.json()
    },
    enabled: !!id, // Só executa se tiver ID
  })
}

export const useCreateCharacter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCharacterRequest) => {
      const response = await api.characters.$post({
        json: data
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create character')
      }

      return await response.json()
    },
    onSuccess: () => {
      // Invalidar cache da lista para refetch automático
      queryClient.invalidateQueries({ queryKey: ['characters'] })
    },
  })
}

export const useUpdateCharacter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCharacterRequest }) => {
      const response = await api.characters[':id'].$put({
        param: { id },
        json: data
      })

      if (!response.ok) {
        const error = await response.json()
        // @ts-ignore
        throw new Error(error.error || 'Failed to update character')
      }

      return await response.json()
    },
    onSuccess: (data, variables) => {
      // Atualizar o cache diretamente com os dados retornados
      queryClient.setQueryData(['character', variables.id], data)
      
      // Invalidar cache da lista
      queryClient.invalidateQueries({ queryKey: ['characters'] })
    },
  })
}

export const useDeleteCharacter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.characters[':id'].$delete({
        param: { id }
      })

      if (!response.ok) {
        const error = await response.json()
        // @ts-ignore
        throw new Error(error.error || 'Failed to delete character')
      }

      return await response.json()
    },
    onSuccess: () => {
      // Invalidar cache da lista para refetch automático
      queryClient.invalidateQueries({ queryKey: ['characters'] })
    },
  })
}

// ============================================
// LEVEL UP MUTATION
// ============================================

export const useLevelUpCharacter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.characters[':id']['level-up'].$post({
        param: { id },
      })

      if (!response.ok) {
        const error = await response.json()
        // @ts-ignore
        throw new Error(error.error || 'Failed to level up character')
      }

      return await response.json()
    },
    onSuccess: (data, id) => {
      // Invalidar cache do personagem específico e da lista
      queryClient.invalidateQueries({ queryKey: ['character', id] })
      queryClient.invalidateQueries({ queryKey: ['characters'] })
    },
  })
}

// ============================================
// CALCULATE VITALITY MUTATION
// ============================================

export const useCalculateVitality = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CalculateVitalityRequest }) => {
      const response = await api.characters[':id']['calculate-vitality'].$post({
        param: { id },
        json: data
      })

      if (!response.ok) {
        const error = await response.json()
        // @ts-ignore
        throw new Error(error.error || 'Failed to calculate vitality')
      }

      return await response.json()
    },
  })
}

// ============================================
// CALCULATE BERKANA MUTATION
// ============================================

export const useCalculateBerkana = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CalculateBerkanaRequest }) => {
      const response = await api.characters[':id']['calculate-berkana'].$post({
        param: { id },
        json: data
      })

      if (!response.ok) {
        const error = await response.json()
        // @ts-ignore
        throw new Error(error.error || 'Failed to calculate berkana')
      }

      return await response.json()
    },
  })
}

// ============================================
// VALIDATE SKILLS MUTATION
// ============================================

export const useValidateSkills = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ValidateSkillsRequest }) => {
      const response = await api.characters[':id']['validate-skills'].$post({
        param: { id },
        json: data
      })

      if (!response.ok) {
        const error = await response.json()
        // @ts-ignore
        throw new Error(error.error || 'Failed to validate skills')
      }

      return await response.json()
    },
  })
}

// ============================================
// CALCULATE ATTRIBUTES MUTATION
// ============================================

export const useCalculateAttributes = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CalculateAttributesRequest }) => {
      const response = await api.characters[':id']['calculate-attributes'].$post({
        param: { id },
        json: data
      })

      if (!response.ok) {
        const error = await response.json()
        // @ts-ignore
        throw new Error(error.error || 'Failed to calculate attributes')
      }

      return await response.json()
    },
  })
}

// ============================================
// CALCULATE XP MUTATION
// ============================================

export const useCalculateXP = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CalculateXPRequest }) => {
      const response = await api.characters[':id']['calculate-xp'].$post({
        param: { id },
        json: data
      })

      if (!response.ok) {
        const error = await response.json()
        // @ts-ignore
        throw new Error(error.error || 'Failed to calculate XP')
      }

      return await response.json()
    },
  })
}

// ============================================
// CALCULATE SKILL POINTS MUTATION
// ============================================

export const useCalculateSkillPoints = () => {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CalculateSkillPointsRequest }) => {
      const response = await api.characters[':id']['calculate-skill-points'].$post({
        param: { id },
        json: data
      })

      if (!response.ok) {
        const error = await response.json()
        // @ts-ignore
        throw new Error(error.error || 'Failed to calculate skill points')
      }

      return await response.json()
    },
  })
}

// ============================================
// RECALCULATE FULL CHARACTER MUTATION
// ============================================

export const useRecalculateCharacter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.characters[':id'].recalculate.$post({
        param: { id },
      })

      if (!response.ok) {
        const error = await response.json()
        // @ts-ignore
        throw new Error(error.error || 'Failed to recalculate character')
      }

      return await response.json()
    },
    onSuccess: (data, id) => {
      // Invalidar cache do personagem específico
      queryClient.invalidateQueries({ queryKey: ['character', id] })
    },
  })
}

// ============================================
// UTILITY HOOKS (apenas consulta, sem mutação)
// ============================================

/**
 * Hook para calcular stats derivados em tempo real (client-side)
 * Útil para preview antes de salvar
 */
export const useCalculateDerivedStats = (characterData: {
  level: number
  attributes: any
  vitality: any
  skills: any
  maxBerkana: number
  berkanaBonus: number
}) => {
  return useMemo(() => {
    if (!characterData) return null

    const { level, attributes, vitality, skills, maxBerkana, berkanaBonus } = characterData

    // Importar funções de cálculo no cliente
    const calculatedAttributes = Object.entries(attributes || {}).reduce((acc, [key, attr]: [string, any]) => {
      const levelBonus = level >= 5 ? Math.floor(level / 5) : 0
      acc[key] = attr.race + attr.class + attr.bonus + levelBonus
      return acc
    }, {} as Record<string, number>)

    const calculatedVitality = vitality ? (() => {
      const baseTotal = vitality.race + vitality.class
      const multiplier = level + 1
      return {
        notavel: baseTotal * multiplier,
        ferido: (baseTotal - 20) * multiplier,
        gravementeFerido: (baseTotal - 40) * multiplier,
        condenado: (baseTotal - 60) * multiplier,
        incapacitado: (baseTotal - 80) * multiplier,
        coma: (baseTotal - 100) * multiplier
      }
    })() : null

    const calculatedBerkana = 100 + (level * 10) + berkanaBonus

    const calculatedSkills = Object.entries(skills || {}).reduce((acc, [key, skill]: [string, any]) => {
      const levelBonus = Math.floor(level / 5)
      acc[key] = 1 + skill.distributed + skill.bonus + levelBonus
      return acc
    }, {} as Record<string, number>)

    const skillPointsUsed = Object.values(skills || {}).reduce((total: number, skill: any) =>
      total + (skill?.distributed || 0), 0)
    const skillPointsAvailable = level * 10
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
  }, [characterData])
}