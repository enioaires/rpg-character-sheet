// Testes dos schemas de lib/schemas/character (API-01, API-03)

import { describe, expect, it } from 'bun:test'
import { updateCharacterSchema, weaponsFieldSchema } from '@/lib/schemas/character'

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
