// lib/notes.ts
// Fonte única para a coluna `notes` (String) do personagem: parse, migração
// de texto antigo e serialização. A coluna continua String no banco.

import { z } from 'zod'

// looseObject preserva chaves desconhecidas num ciclo leitura -> escrita
export const noteSchema = z.looseObject({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Note = z.infer<typeof noteSchema>

export type ParsedNotes =
  | { status: 'empty'; notes: Note[] }
  | { status: 'ok'; notes: Note[] }
  | { status: 'legacy'; notes: Note[]; legacyText: string }
  | { status: 'corrupted'; notes: Note[]; raw: string }

// Representação em texto de um valor inesperado (nunca lança)
function describeRaw(value: unknown): string {
  try {
    const encoded = JSON.stringify(value)
    if (typeof encoded === 'string') return encoded
  } catch {
    // valor não serializável (ex.: referência circular): cai no String()
  }
  return String(value)
}

// Valida uma lista de itens como notas; null se algum item for inválido
function validateNotes(items: unknown[]): Note[] | null {
  const notes: Note[] = []
  for (const item of items) {
    const result = noteSchema.safeParse(item)
    if (!result.success) return null
    notes.push(result.data)
  }
  return notes
}

/**
 * Classifica o valor da coluna `notes` sem lançar e sem efeitos colaterais.
 * - empty: null/undefined/string em branco
 * - ok: array JSON (ou array real) de notas válidas
 * - legacy: texto simples de versões antigas (não começa com [ ou {)
 * - corrupted: qualquer outra coisa (conteúdo original preservado em `raw`)
 */
export function parseNotes(raw: unknown): ParsedNotes {
  if (raw === null || raw === undefined) {
    return { status: 'empty', notes: [] }
  }

  if (Array.isArray(raw)) {
    const notes = validateNotes(raw)
    return notes
      ? { status: 'ok', notes }
      : { status: 'corrupted', notes: [], raw: describeRaw(raw) }
  }

  if (typeof raw !== 'string') {
    return { status: 'corrupted', notes: [], raw: describeRaw(raw) }
  }

  const trimmed = raw.trim()
  if (trimmed === '') {
    return { status: 'empty', notes: [] }
  }

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed: unknown = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        const notes = validateNotes(parsed)
        if (notes) return { status: 'ok', notes }
      }
    } catch {
      // JSON malformado: tratado como corrompido abaixo
    }
    return { status: 'corrupted', notes: [], raw }
  }

  return { status: 'legacy', notes: [], legacyText: trimmed }
}

// Único ponto onde a lista de notas vira o texto da coluna
export function serializeNotes(notes: Note[]): string {
  return JSON.stringify(notes)
}

// `now` único para id/createdAt/updatedAt (evita o rótulo "Editado" indevido)
export function createNote(
  input: { title: string; content: string },
  now: Date = new Date(),
): Note {
  const timestamp = now.toISOString()
  return {
    id: String(now.getTime()),
    title: input.title.trim(),
    content: input.content.trim(),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

// Converte o texto simples antigo em uma única nota
export function migrateLegacyNotes(
  legacyText: string,
  now: Date = new Date(),
): Note[] {
  return [createNote({ title: 'Anotações Antigas', content: legacyText }, now)]
}

// Escopo de módulo (e não de componente): sobrevive ao Strict Mode e a
// remontagens da aba enquanto a gravação está em andamento
const claimedLegacyMigrations = new Set<string>()

// true somente na primeira vez por par (personagem, texto antigo)
export function claimLegacyMigration(
  characterId: string,
  legacyText: string,
): boolean {
  const key = `${characterId}\u0000${legacyText}`
  if (claimedLegacyMigrations.has(key)) return false
  claimedLegacyMigrations.add(key)
  return true
}
