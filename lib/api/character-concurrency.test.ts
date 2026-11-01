// Testes da concorrência otimista (API-02): contrato da rota PUT e núcleo do cliente.
//
// Nunca tocam um banco real: @/lib/db é substituído por um banco falso em
// memória ANTES de a rota ser carregada. Por isso a rota é carregada com
// import dinâmico (imports estáticos são içados acima do mock.module).

import { describe, expect, it, mock } from 'bun:test'
import { QueryClient } from '@tanstack/react-query'
import { getDefaultCharacterData } from '@/lib/defaults/character'

type Row = Record<string, unknown> & { id: string; updatedAt: Date; characterName: string }

const rows = new Map<string, Row>()
const hooks: {
  afterUpdate: ((row: Row) => void) | null
  failNextUpdate: boolean
  lastReturned: Row | null
} = { afterUpdate: null, failNextUpdate: false, lastReturned: null }

const fakeDb = {
  character: {
    async findUnique({ where }: { where: { id: string } }) {
      const row = rows.get(where.id)
      return row ? { ...row } : null
    },
    async update({
      where,
      data,
    }: {
      where: { id: string; updatedAt?: Date }
      data: Record<string, unknown>
    }) {
      if (hooks.failNextUpdate) {
        hooks.failNextUpdate = false
        throw new Error('falha inesperada do banco')
      }
      const row = rows.get(where.id)
      if (
        !row ||
        (where.updatedAt && row.updatedAt.getTime() !== where.updatedAt.getTime())
      ) {
        throw Object.assign(new Error('Record to update not found.'), { code: 'P2025' })
      }
      Object.assign(row, data)
      row.updatedAt = (data.updatedAt as Date | undefined) ?? new Date()
      const returned = { ...row }
      hooks.lastReturned = returned
      // Simula outro dispositivo gravando logo depois deste UPDATE
      hooks.afterUpdate?.(row)
      return returned
    },
  },
}

mock.module('@/lib/db', () => ({ db: fakeDb }))

const { default: characters } = await import('@/app/api/[[...route]]/characters')
const {
  characterQueryKey,
  readUpdatedAt,
  saveCharacterUpdate,
  isCharacterConflictError,
} = await import('./character-concurrency')

// ============================================
// HELPERS
// ============================================

let counter = 0

function seed(overrides: Partial<Row> = {}): Row {
  const id = `char-iii-${++counter}`
  const row = {
    ...getDefaultCharacterData(),
    id,
    characterName: 'Original',
    playerName: null,
    class: null,
    race: null,
    deity: null,
    homeland: null,
    alignment: null,
    gender: null,
    age: null,
    weight: null,
    height: null,
    virtuePoints: null,
    notes: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as Row
  rows.set(id, row)
  return row
}

function putRaw(id: string, body: unknown) {
  return characters.request('/' + id, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const putFor = (id: string) => async (body: unknown) => putRaw(id, body)

const fetchCharacterFor = async (id: string) => {
  const res = await characters.request('/' + id)
  return res.json()
}

function seedClient(row: Row) {
  const queryClient = new QueryClient()
  queryClient.setQueryData(characterQueryKey(row.id), {
    character: { ...row, updatedAt: row.updatedAt.toISOString() },
  })
  return queryClient
}

function save(
  queryClient: QueryClient,
  id: string,
  data: Record<string, unknown>,
) {
  return saveCharacterUpdate({
    queryClient,
    id,
    data,
    put: putFor(id),
    fetchCharacter: fetchCharacterFor,
  })
}

// Simula outro dispositivo alterando o personagem
function otherDeviceWrites(row: Row, characterName = 'Outro dispositivo') {
  row.characterName = characterName
  row.updatedAt = new Date(row.updatedAt.getTime() + 60_000)
}

// ============================================
// ROTA PUT /:id
// ============================================

describe('PUT /:id (contrato da rota)', () => {
  it('(a) token atual responde 200 e devolve um updatedAt novo', async () => {
    const row = seed()
    const token = row.updatedAt.toISOString()
    const res = await putRaw(row.id, { characterName: 'Novo', expectedUpdatedAt: token })
    expect(res.status).toBe(200)
    const json = (await res.json()) as { character: { characterName: string; updatedAt: string } }
    expect(json.character.characterName).toBe('Novo')
    expect(json.character.updatedAt).not.toBe(token)
    expect(row.characterName).toBe('Novo')
  })

  it('(b) token defasado responde 409 e não altera a linha', async () => {
    const row = seed()
    const before = row.updatedAt.toISOString()
    const res = await putRaw(row.id, {
      characterName: 'Novo',
      expectedUpdatedAt: '2025-12-31T00:00:00.000Z',
    })
    expect(res.status).toBe(409)
    expect(row.characterName).toBe('Original')
    expect(row.updatedAt.toISOString()).toBe(before)
  })

  it('(c) id inexistente com token responde 404', async () => {
    const res = await putRaw('nao-existe', {
      characterName: 'Novo',
      expectedUpdatedAt: '2026-01-01T00:00:00.000Z',
    })
    expect(res.status).toBe(404)
  })

  it('(d) sem token grava incondicionalmente (exceção de compatibilidade)', async () => {
    const row = seed()
    const res = await putRaw(row.id, { characterName: 'Legado' })
    expect(res.status).toBe(200)
    expect(row.characterName).toBe('Legado')
  })

  it('(e) token malformado responde 400 "Dados inválidos"', async () => {
    const row = seed()
    const res = await putRaw(row.id, { characterName: 'Novo', expectedUpdatedAt: 'ontem' })
    expect(res.status).toBe(400)
    const json = (await res.json()) as { error: string }
    expect(json.error).toBe('Dados inválidos')
    expect(row.characterName).toBe('Original')
  })

  it('(r) token válido com weapons malformado responde 400 e não altera a linha', async () => {
    const row = seed()
    const before = row.updatedAt.toISOString()
    const res = await putRaw(row.id, { weapons: {}, expectedUpdatedAt: before })
    expect(res.status).toBe(400)
    const json = (await res.json()) as { error: string; issues: { path: string }[] }
    expect(json.error).toBe('Dados inválidos')
    expect(json.issues.some(issue => issue.path.startsWith('weapons'))).toBe(true)
    expect(row.updatedAt.toISOString()).toBe(before)
    expect(row.characterName).toBe('Original')
  })
})

// ============================================
// NÚCLEO DO CLIENTE: UMA GRAVAÇÃO
// ============================================

describe('saveCharacterUpdate (uma gravação)', () => {
  it('(f) grava e renova o updatedAt em cache', async () => {
    const row = seed()
    const queryClient = seedClient(row)
    await save(queryClient, row.id, { characterName: 'Salvo' })
    expect(row.characterName).toBe('Salvo')
    expect(readUpdatedAt(queryClient.getQueryData(characterQueryKey(row.id)))).toBe(
      row.updatedAt.toISOString(),
    )
  })

  it('(g) após outro dispositivo alterar, rejeita com conflito e preserva a edição alheia', async () => {
    const row = seed()
    const queryClient = seedClient(row)
    otherDeviceWrites(row)
    const error = await save(queryClient, row.id, { characterName: 'Meu' }).catch(e => e)
    expect(isCharacterConflictError(error)).toBe(true)
    expect(row.characterName).toBe('Outro dispositivo')
  })

  it('(s) o token em cache é o desta gravação, não o de uma gravação alheia posterior', async () => {
    const row = seed()
    const queryClient = seedClient(row)
    const otherUpdatedAt = new Date(Date.now() + 60_000)
    hooks.afterUpdate = r => {
      r.updatedAt = otherUpdatedAt
      r.characterName = 'Outro dispositivo'
    }
    try {
      await save(queryClient, row.id, { level: 3 })
      const cached = readUpdatedAt(queryClient.getQueryData(characterQueryKey(row.id)))
      expect(cached).toBe(hooks.lastReturned!.updatedAt.toISOString())
      expect(cached).not.toBe(otherUpdatedAt.toISOString())
    } finally {
      hooks.afterUpdate = null
    }
    const error = await save(queryClient, row.id, { level: 4 }).catch(e => e)
    expect(isCharacterConflictError(error)).toBe(true)
    expect(row.characterName).toBe('Outro dispositivo')
  })
})
