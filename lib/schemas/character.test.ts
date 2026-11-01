// Testes dos schemas de lib/schemas/character (API-01, API-03)

import { describe, expect, it } from 'bun:test'
import { DEFAULT_ADVENTURE_KIT } from '@/lib/constants/character'
import { getDefaultCharacterData } from '@/lib/defaults/character'
import {
  getCharactersQuerySchema,
  updateCharacterSchema,
  weaponsFieldSchema,
} from '@/lib/schemas/character'

const JSON_FIELDS = [
  'attributes',
  'vitality',
  'currentVitality',
  'skills',
  'weapons',
  'armor',
  'adventureKit',
  'finances',
  'languages',
  'spells',
  'talents',
] as const

const ok = (data: unknown) => updateCharacterSchema.safeParse(data).success

// ============================================
// CAMPO JSON: weapons
// ============================================

describe('weaponsFieldSchema', () => {
  it('aceita formatos escritos pela UI', () => {
    expect(weaponsFieldSchema.safeParse([]).success).toBe(true)
    expect(weaponsFieldSchema.safeParse([null, null, { name: 'Arco' }]).success).toBe(true)
    expect(weaponsFieldSchema.safeParse([{ damage: { d25: '1d6' } }]).success).toBe(true)
  })

  it('preserva chaves desconhecidas/legadas', () => {
    const legacy = [
      {
        name: 'Espada Longa',
        level: 25,
        damage: { percent25: '1d6', critical: '2d12' },
        observations: 'Encantada',
      },
    ]
    const result = weaponsFieldSchema.safeParse(legacy)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual(legacy)
  })

  it('rejeita formatos malformados', () => {
    expect(weaponsFieldSchema.safeParse({}).success).toBe(false)
    expect(weaponsFieldSchema.safeParse(['espada']).success).toBe(false)
    expect(weaponsFieldSchema.safeParse([{ level: '25' }]).success).toBe(false)
    expect(weaponsFieldSchema.safeParse([{}, {}, {}, {}]).success).toBe(false)
  })

  it('é usado por updateCharacterSchema', () => {
    expect(updateCharacterSchema.safeParse({ weapons: {} }).success).toBe(false)
    expect(updateCharacterSchema.safeParse({ weapons: [null, { name: 'Arco' }] }).success).toBe(true)
  })
})

// ============================================
// FORMATOS ESCRITOS PELA UI (devem passar)
// ============================================

describe('updateCharacterSchema aceita os formatos da UI', () => {
  const defaults = getDefaultCharacterData() as Record<string, unknown>

  it('getDefaultCharacterData() inteiro e campo a campo', () => {
    const combined = Object.fromEntries(JSON_FIELDS.map(f => [f, defaults[f]]))
    expect(ok(combined)).toBe(true)
    for (const field of JSON_FIELDS) {
      expect(ok({ [field]: defaults[field] })).toBe(true)
    }
  })

  it('DEFAULT_ADVENTURE_KIT e fallbacks sanitizados da página', () => {
    expect(ok({ adventureKit: DEFAULT_ADVENTURE_KIT })).toBe(true)
    expect(ok({ vitality: { race: 0, class: 0 } })).toBe(true)
    expect(
      ok({ armor: { name: '', description: '', totalVitality: 0, currentVitality: 0 } }),
    ).toBe(true)
    expect(ok({ finances: { ouro: 0, prata: 0, cobre: 0, imperano: 0, joias: 0 } })).toBe(true)
  })

  it('entradas parciais e tolerantes', () => {
    expect(ok({ attributes: { esquiva: { race: 3 } } })).toBe(true)
    expect(ok({ skills: { novaPericia: { distributed: 2 } } })).toBe(true)
    expect(
      ok({
        currentVitality: {
          notavel: 0,
          ferido: -20,
          gravementeFerido: -40,
          condenado: -60,
          incapacitado: -80,
          coma: -100,
        },
      }),
    ).toBe(true)
    expect(
      ok({
        languages: {
          standard: { comum: true },
          custom: [{ name: 'Dracônico', known: true }],
        },
      }),
    ).toBe(true)
    expect(
      ok({
        languages: {
          standard: { comum: false },
          custom: { '0': { name: 'Dracônico', known: true } },
        },
      }),
    ).toBe(true)
    expect(
      ok({
        spells: [
          {
            name: 'Nova',
            level: 1,
            damage: { base: 0, perLevel: null },
            duration: { base: '', perLevel: null },
          },
        ],
      }),
    ).toBe(true)
    expect(
      ok({
        spells: [
          { name: 'Bola de Fogo', damage: '8d6', duration: 'Instantâneo', preparationTime: '1 ação' },
        ],
      }),
    ).toBe(true)
    expect(ok({ spells: [{ damage: 10, duration: null }] })).toBe(true)
    expect(ok({ talents: [{ name: 'Ataque Furtivo', level: 2, description: 'x' }] })).toBe(true)
    expect(
      ok({
        talents: [
          { name: 'Fúria', level: 1, description: '', oncePerDay: true, usedToday: false },
        ],
      }),
    ).toBe(true)
  })

  it('preserva chaves legadas em spells e talents', () => {
    const spells = [
      { name: 'Bola de Fogo', damage: '8d6', duration: 'Instantâneo', preparationTime: '1 ação' },
    ]
    const talents = [{ name: 'Ataque Furtivo', level: 2, description: 'x', extra: 'legado' }]
    const result = updateCharacterSchema.safeParse({ spells, talents })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.spells).toEqual(spells)
      expect(result.data.talents).toEqual(talents)
    }
  })
})

// ============================================
// FORMATOS MALFORMADOS (devem falhar)
// ============================================

describe('updateCharacterSchema rejeita JSON malformado', () => {
  const bad: [string, unknown][] = [
    ['attributes string', { attributes: 'abc' }],
    ['attributes leaf string', { attributes: { agilidade: { race: '10' } } }],
    ['vitality array', { vitality: [] }],
    ['currentVitality null', { currentVitality: null }],
    ['currentVitality leaf string', { currentVitality: { ferido: '5' } }],
    ['skills negative distributed', { skills: { acrobacia: { distributed: -1 } } }],
    ['skills distributed string', { skills: { acrobacia: { distributed: 'x' } } }],
    ['armor string', { armor: 'x' }],
    ['armor totalVitality string', { armor: { totalVitality: '50' } }],
    ['adventureKit object', { adventureKit: {} }],
    ['adventureKit quantity string', { adventureKit: [{ quantity: '3' }] }],
    ['finances ouro string', { finances: { ouro: 'muito' } }],
    ['languages standard string', { languages: { standard: 'x' } }],
    ['languages custom string', { languages: { custom: 'x' } }],
    ['spells string', { spells: 'x' }],
    ['spells level string', { spells: [{ level: 'dois' }] }],
    ['spells damage base boolean', { spells: [{ damage: { base: true } }] }],
    ['talents oncePerDay string', { talents: [{ oncePerDay: 'sim' }] }],
    ['talents object', { talents: {} }],
  ]
  for (const [label, body] of bad) {
    it(label, () => {
      expect(ok(body)).toBe(false)
    })
  }
})

// ============================================
// PAGINAÇÃO (API-03)
// ============================================

describe('getCharactersQuerySchema', () => {
  const parse = (q: Record<string, string>) => getCharactersQuerySchema.parse(q)

  it('usa page 1 e limit 10 por padrão', () => {
    expect(parse({})).toEqual({ page: 1, limit: 10 })
  })

  it('limita page a 1..10000 com fallback 1', () => {
    expect(parse({ page: '0' }).page).toBe(1)
    expect(parse({ page: '-3' }).page).toBe(1)
    expect(parse({ page: 'abc' }).page).toBe(1)
    expect(parse({ page: '' }).page).toBe(1)
    expect(parse({ page: '2' }).page).toBe(2)
    expect(parse({ page: '99999999999999999999' }).page).toBe(10000)
  })

  it('limita limit a 1..100 com fallback 10', () => {
    expect(parse({ limit: '12' }).limit).toBe(12)
    expect(parse({ limit: '1000000' }).limit).toBe(100)
    expect(parse({ limit: '100' }).limit).toBe(100)
    expect(parse({ limit: '0' }).limit).toBe(1)
    expect(parse({ limit: '-5' }).limit).toBe(1)
    expect(parse({ limit: 'abc' }).limit).toBe(10)
  })

  it('repassa search sem alterar', () => {
    expect(parse({ search: 'ana' }).search).toBe('ana')
  })
})
