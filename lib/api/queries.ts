import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './client'
import type { GetCharactersQuery, CreateCharacterRequest, UpdateCharacterRequest } from '@/lib/schemas/character'

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
      // Invalidar cache da lista e do personagem específico
      queryClient.invalidateQueries({ queryKey: ['characters'] })
      queryClient.invalidateQueries({ queryKey: ['character', variables.id] })
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