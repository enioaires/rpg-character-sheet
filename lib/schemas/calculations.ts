// lib/schemas/calculations.ts
import { z } from 'zod'

// ============================================
// SCHEMAS POR CAMPO (reutilizados na validação dos dados do personagem)
// ============================================

export const attributeValueSchema = z.object({
  race: z.number(),
  class: z.number(),
  bonus: z.number(),
})

export const vitalityBaseSchema = z.object({
  race: z.number(),
  class: z.number(),
  perLevel: z.number(),
})

export const currentVitalitySchema = z.object({
  current: z.number().nullable(),
})

export const skillValueSchema = z.object({
  distributed: z.number().min(0),
  bonus: z.number(),
})
