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

// ============================================
// FILA SERIAL POR PERSONAGEM
// ============================================

const saveQueues = new Map<string, Promise<unknown>>()

// Gravações do mesmo personagem rodam uma por vez: duas enviadas juntas
// levariam o mesmo token e a segunda receberia um 409 espúrio. Uma tarefa que
// falha não trava as seguintes.
export function enqueueCharacterSave<T>(id: string, task: () => Promise<T>): Promise<T> {
  const previous = saveQueues.get(id) ?? Promise.resolve()
  const run = previous.then(() => task())
  const tail = run.then(
    () => undefined,
    () => undefined,
  )
  saveQueues.set(id, tail)
  tail.then(() => {
    if (saveQueues.get(id) === tail) saveQueues.delete(id)
  })
  return run
}

// ============================================
// LINHAGEM DE VERSÕES PRÓPRIAS
// ============================================

// id -> (token enviado -> updatedAt devolvido) apenas das gravações bem-sucedidas
// deste dispositivo. O token é a versão em que a edição do usuário se baseou e só
// avança por gravações próprias: assim as gravações enfileiradas enviam a versão
// produzida pela anterior, enquanto uma edição feita sobre dados já alterados por
// outro dispositivo continua enviando a versão defasada e recebe 409.
const ownVersions = new Map<string, Map<string, string>>()

function recordOwnVersion(id: string, sent: string, returned: string | undefined) {
  if (!returned || returned === sent) return
  let lineage = ownVersions.get(id)
  if (!lineage) {
    lineage = new Map()
    ownVersions.set(id, lineage)
  }
  lineage.set(sent, returned)
}

function resolveOwnVersion(id: string, base: string): string {
  const lineage = ownVersions.get(id)
  if (!lineage) return base
  const visited = new Set<string>([base])
  let current = base
  for (;;) {
    const next = lineage.get(current)
    if (next === undefined || visited.has(next)) return current
    visited.add(next)
    current = next
  }
}

export async function saveCharacterUpdate({
  queryClient,
  id,
  data,
  put,
  fetchCharacter,
}: SaveCharacterUpdateArgs): Promise<unknown> {
  // O token base é capturado de forma síncrona, antes de entrar na fila
  const base = readUpdatedAt(queryClient.getQueryData(characterQueryKey(id)))

  return enqueueCharacterSave(id, async () => {
    let expectedUpdatedAt: string | undefined
    if (base) {
      expectedUpdatedAt = resolveOwnVersion(id, base)
    } else {
      expectedUpdatedAt =
        readUpdatedAt(queryClient.getQueryData(characterQueryKey(id))) ??
        readUpdatedAt(
          await queryClient.fetchQuery({
            queryKey: characterQueryKey(id),
            queryFn: () => fetchCharacter(id),
          }),
        )
    }
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
    recordOwnVersion(id, expectedUpdatedAt, readUpdatedAt(result))

    // Um GET iniciado antes ou durante este PUT não pode sobrescrever o cache
    // com dados mais antigos e dar um token errado à próxima gravação.
    await queryClient.cancelQueries({ queryKey: characterQueryKey(id), exact: true })
    // Cada resposta bem-sucedida renova o updatedAt usado na próxima gravação
    queryClient.setQueryData(characterQueryKey(id), result)
    return result
  })
}

// Conflito: um toast (id estável, para várias gravações rejeitadas pelo mesmo
// conflito gerarem um só) e refetch do personagem. Outros erros ficam com o
// catch de cada chamador.
export function handleCharacterSaveError(
  error: unknown,
  id: string,
  {
    queryClient,
    notify,
  }: {
    queryClient: QueryClient
    notify: (message: string, options: { id: string }) => void
  },
): void {
  if (!isCharacterConflictError(error)) return
  notify(CHARACTER_CONFLICT_MESSAGE, { id: 'character-conflict-' + id })
  void queryClient.invalidateQueries({ queryKey: characterQueryKey(id), exact: true })
}
