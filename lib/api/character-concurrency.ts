// Núcleo "headless" de gravação com concorrência otimista (API-02).
// Não importa React, sonner nem o client do Hono: roda sob bun test.

import type { QueryClient } from '@tanstack/react-query'
import type { UpdateCharacterRequest } from '@/lib/schemas/character'

export const characterQueryKey = (id: string) => ['character', id] as const

export const CHARACTER_CONFLICT_MESSAGE =
  'Este personagem foi alterado em outro dispositivo. Recarregamos os dados mais recentes — refaça sua alteração.'

export class CharacterConflictError extends Error {
  constructor() {
    super(CHARACTER_CONFLICT_MESSAGE)
    this.name = 'CharacterConflictError'
  }
}

export function isCharacterConflictError(error: unknown): error is CharacterConflictError {
  return error instanceof CharacterConflictError
}

// Lê data.character.updatedAt de um payload de GET ou PUT em cache
export function readUpdatedAt(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  const character = (data as { character?: unknown }).character
  if (typeof character !== 'object' || character === null) return undefined
  const updatedAt = (character as { updatedAt?: unknown }).updatedAt
  if (typeof updatedAt === 'string') return updatedAt
  if (updatedAt instanceof Date) return updatedAt.toISOString()
  return undefined
}

export type CharacterPutBody = UpdateCharacterRequest & { expectedUpdatedAt: string }

export type CharacterPutResponse = {
  ok: boolean
  status: number
  json(): Promise<unknown>
}

export type SaveCharacterUpdateArgs = {
  queryClient: QueryClient
  id: string
  data: UpdateCharacterRequest
  put: (body: CharacterPutBody) => Promise<CharacterPutResponse>
  fetchCharacter: (id: string) => Promise<unknown>
}

export async function saveCharacterUpdate({
  queryClient,
  id,
  data,
  put,
}: SaveCharacterUpdateArgs): Promise<unknown> {
  const expectedUpdatedAt = readUpdatedAt(queryClient.getQueryData(characterQueryKey(id)))
  if (!expectedUpdatedAt) {
    throw new Error('Failed to update character')
  }

  const response = await put({ ...data, expectedUpdatedAt })

  if (response.status === 409) {
    throw new CharacterConflictError()
  }
  if (!response.ok) {
    let body: { error?: string } = {}
    try {
      body = (await response.json()) as { error?: string }
    } catch {
      // corpo de erro não é JSON: usa a mensagem padrão
    }
    throw new Error(body.error || 'Failed to update character')
  }

  const result = await response.json()
  // Cada resposta bem-sucedida renova o updatedAt usado na próxima gravação
  queryClient.setQueryData(characterQueryKey(id), result)
  return result
}
