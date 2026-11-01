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
})

export const vitalityLevelsSchema = z.object({
  notavel: z.number(),
  ferido: z.number(),
  gravementeFerido: z.number(),
  condenado: z.number(),
  incapacitado: z.number(),
  coma: z.number(),
})

export const skillValueSchema = z.object({
  distributed: z.number().min(0),
  bonus: z.number(),
})
