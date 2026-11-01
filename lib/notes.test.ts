// Testes unitários de lib/notes (NOTE-01)
//
// Cobrem parse (ok/empty/legacy/corrupted), serialização, criação de nota,
// migração de texto antigo e o guarda de migração única.

import { describe, expect, it } from 'bun:test'
import {
  claimLegacyMigration,
  migrateLegacyNotes,
  parseNotes,
  serializeNotes,
  type Note,
} from '@/lib/notes'

const NOTE_A: Note = {
  id: '1',
  title: 'Primeira',
  content: 'Conteudo A',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

const NOTE_B: Note = {
  id: '2',
  title: 'Segunda',
  content: 'Conteudo B',
  createdAt: '2024-01-02T00:00:00.000Z',
  updatedAt: '2024-01-03T00:00:00.000Z',
}

describe('parseNotes', () => {
  it('null, undefined e string em branco são empty', () => {
    for (const raw of [null, undefined, '', '   ']) {
      const parsed = parseNotes(raw)
      expect(parsed.status).toBe('empty')
      expect(parsed.notes).toEqual([])
    }
  })

  it('array serializado de notas válidas é ok e preserva a ordem', () => {
    const parsed = parseNotes(JSON.stringify([NOTE_A, NOTE_B]))
    expect(parsed.status).toBe('ok')
    expect(parsed.notes).toEqual([NOTE_A, NOTE_B])
  })

  it('preserva chaves desconhecidas de uma nota', () => {
    const withExtra = { ...NOTE_A, cor: 'azul' }
    const parsed = parseNotes(JSON.stringify([withExtra]))
    expect(parsed.status).toBe('ok')
    expect(parsed.notes).toEqual([withExtra])
  })

  it('um array real de notas válidas é ok', () => {
    const parsed = parseNotes([NOTE_A, NOTE_B])
    expect(parsed.status).toBe('ok')
    expect(parsed.notes).toEqual([NOTE_A, NOTE_B])
  })

  it('"[]" é ok com lista vazia', () => {
    const parsed = parseNotes('[]')
    expect(parsed.status).toBe('ok')
    expect(parsed.notes).toEqual([])
  })

  it('texto simples é legacy com o texto aparado', () => {
    const parsed = parseNotes('  Minhas anotações\nlinha 2  ')
    expect(parsed.status).toBe('legacy')
    if (parsed.status !== 'legacy') throw new Error('esperava legacy')
    expect(parsed.legacyText).toBe('Minhas anotações\nlinha 2')
    expect(parsed.notes).toEqual([])
  })

  it('objeto JSON é corrupted e guarda o raw original', () => {
    const raw = '{"a":1}'
    const parsed = parseNotes(raw)
    expect(parsed.status).toBe('corrupted')
    if (parsed.status !== 'corrupted') throw new Error('esperava corrupted')
    expect(parsed.raw).toBe(raw)
    expect(parsed.notes).toEqual([])
  })

  it('JSON malformado é corrupted', () => {
    const raw = '[{"id":"1"'
    const parsed = parseNotes(raw)
    expect(parsed.status).toBe('corrupted')
    if (parsed.status !== 'corrupted') throw new Error('esperava corrupted')
    expect(parsed.raw).toBe(raw)
  })

  it('itens que não são notas tornam o valor corrupted', () => {
    expect(parseNotes('[1,2]').status).toBe('corrupted')
    expect(parseNotes('[{"id":"1","title":"x"}]').status).toBe('corrupted')
    expect(parseNotes([{ id: '1' }]).status).toBe('corrupted')
  })

  it('valor que não é string nem array é corrupted com raw string', () => {
    const parsed = parseNotes(42)
    expect(parsed.status).toBe('corrupted')
    if (parsed.status !== 'corrupted') throw new Error('esperava corrupted')
    expect(typeof parsed.raw).toBe('string')
    expect(parsed.raw).toBe('42')
  })

  it('nunca lança, mesmo com valor circular', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    const parsed = parseNotes(circular)
    expect(parsed.status).toBe('corrupted')
  })
})

describe('serializeNotes', () => {
  it('lista vazia vira "[]"', () => {
    expect(serializeNotes([])).toBe('[]')
  })

  it('faz round trip com parseNotes', () => {
    const parsed = parseNotes(serializeNotes([NOTE_A, NOTE_B]))
    expect(parsed.status).toBe('ok')
    expect(parsed.notes).toEqual([NOTE_A, NOTE_B])
  })
})

describe('migrateLegacyNotes', () => {
  const fixedDate = new Date('2024-05-06T07:08:09.000Z')

  it('gera exatamente uma nota "Anotações Antigas" com o texto aparado', () => {
    const notes = migrateLegacyNotes('  texto antigo  ', fixedDate)
    expect(notes).toHaveLength(1)
    expect(notes[0].title).toBe('Anotações Antigas')
    expect(notes[0].content).toBe('texto antigo')
    expect(notes[0].id).toBe(String(fixedDate.getTime()))
    expect(notes[0].createdAt).toBe(fixedDate.toISOString())
    expect(notes[0].updatedAt).toBe(fixedDate.toISOString())
  })

  it('o resultado serializado é lido de volta como ok com 1 nota', () => {
    const parsed = parseNotes(serializeNotes(migrateLegacyNotes('texto', fixedDate)))
    expect(parsed.status).toBe('ok')
    expect(parsed.notes).toHaveLength(1)
  })
})

describe('claimLegacyMigration', () => {
  it('só concede a reivindicação na primeira vez por par (personagem, texto)', () => {
    expect(claimLegacyMigration('claim-char-A', 'txt')).toBe(true)
    expect(claimLegacyMigration('claim-char-A', 'txt')).toBe(false)
    expect(claimLegacyMigration('claim-char-B', 'txt')).toBe(true)
    expect(claimLegacyMigration('claim-char-A', 'outro')).toBe(true)
  })
})
