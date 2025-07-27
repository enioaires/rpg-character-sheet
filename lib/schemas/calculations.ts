// lib/schemas/calculations.ts
import { z } from 'zod'

// ============================================
// SCHEMAS BASE PARA CÁLCULOS
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

// ============================================
// LEVEL UP API
// ============================================

export const levelUpRequestSchema = z.object({
  // Vazio - usamos apenas o ID do personagem da URL
})

export const levelUpResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    oldLevel: z.number(),
    newLevel: z.number(),
    oldCurrentXP: z.number(),
    newCurrentXP: z.number(),
    xpUsedForLevelUp: z.number(),
    newSkillPointsAvailable: z.number(),
    newMaxBerkana: z.number(),
    newVitalityLevels: vitalityLevelsSchema,
  }),
})

// ============================================
// CALCULATE VITALITY API
// ============================================

export const calculateVitalityRequestSchema = z.object({
  vitality: vitalityBaseSchema,
  level: z.number().min(0).max(99),
})

export const calculateVitalityResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    level: z.number(),
    vitalityBase: vitalityBaseSchema,
    vitalityLevels: vitalityLevelsSchema,
    calculations: z.object({
      baseTotal: z.number(),
      multiplier: z.number(),
      formula: z.string(),
    }),
  }),
})

// ============================================
// CALCULATE BERKANA API
// ============================================

export const calculateBerkanaRequestSchema = z.object({
  level: z.number().min(0).max(99),
  baseValue: z.number().min(0),
  bonus: z.number(),
})

export const calculateBerkanaResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    level: z.number(),
    baseValue: z.number(),
    bonus: z.number(),
    maxBerkana: z.number(),
    calculations: z.object({
      levelBonus: z.number(),
      formula: z.string(),
    }),
  }),
})

// ============================================
// VALIDATE SKILLS API
// ============================================

export const validateSkillsRequestSchema = z.object({
  skills: z.record(z.string(), skillValueSchema),
  level: z.number().min(0).max(99),
})

export const validateSkillsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    isValid: z.boolean(),
    errors: z.array(z.string()),
    summary: z.object({
      totalAvailable: z.number(),
      totalUsed: z.number(),
      totalRemaining: z.number(),
      skillsWithIssues: z.array(z.string()),
    }),
    skillTotals: z.record(z.string(), z.number()),
  }),
})

// ============================================
// CALCULATE ATTRIBUTES API
// ============================================

export const calculateAttributesRequestSchema = z.object({
  attributes: z.record(z.string(), attributeValueSchema),
  level: z.number().min(0).max(99),
})

export const calculateAttributesResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    level: z.number(),
    attributeTotals: z.record(z.string(), z.number()),
    calculations: z.object({
      levelBonus: z.number(),
      formula: z.string(),
    }),
  }),
})

// ============================================
// XP CALCULATION API
// ============================================

export const calculateXPRequestSchema = z.object({
  currentLevel: z.number().min(0).max(98), // Máximo 98 porque 99 é o nível máximo
})

export const calculateXPResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    currentLevel: z.number(),
    xpRequiredForNext: z.number(),
    totalXPForCurrentLevel: z.number(),
    totalXPForNextLevel: z.number(),
    maxLevel: z.number(),
  }),
})

// ============================================
// SKILL POINTS API
// ============================================

export const calculateSkillPointsRequestSchema = z.object({
  skills: z.record(z.string(), skillValueSchema),
  level: z.number().min(0).max(99),
})

export const calculateSkillPointsResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    level: z.number(),
    pointsPerLevel: z.number(),
    totalAvailable: z.number(),
    totalUsed: z.number(),
    totalRemaining: z.number(),
    breakdown: z.object({
      distributed: z.record(z.string(), z.number()),
      totals: z.record(z.string(), z.number()),
    }),
  }),
})

// ============================================
// FULL CHARACTER RECALCULATION API
// ============================================

export const recalculateCharacterRequestSchema = z.object({
  // Recalcula tudo baseado nos dados atuais do personagem
  // Usa apenas o ID da URL
})

export const recalculateCharacterResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    level: z.number(),
    calculatedAttributes: z.record(z.string(), z.number()),
    calculatedVitality: vitalityLevelsSchema,
    calculatedBerkana: z.number(),
    calculatedSkills: z.record(z.string(), z.number()),
    skillValidation: z.object({
      isValid: z.boolean(),
      errors: z.array(z.string()),
      pointsRemaining: z.number(),
    }),
  }),
})

// ============================================
// TIPOS EXPORTADOS
// ============================================

export type LevelUpRequest = z.infer<typeof levelUpRequestSchema>
export type LevelUpResponse = z.infer<typeof levelUpResponseSchema>

export type CalculateVitalityRequest = z.infer<typeof calculateVitalityRequestSchema>
export type CalculateVitalityResponse = z.infer<typeof calculateVitalityResponseSchema>

export type CalculateBerkanaRequest = z.infer<typeof calculateBerkanaRequestSchema>
export type CalculateBerkanaResponse = z.infer<typeof calculateBerkanaResponseSchema>

export type ValidateSkillsRequest = z.infer<typeof validateSkillsRequestSchema>
export type ValidateSkillsResponse = z.infer<typeof validateSkillsResponseSchema>

export type CalculateAttributesRequest = z.infer<typeof calculateAttributesRequestSchema>
export type CalculateAttributesResponse = z.infer<typeof calculateAttributesResponseSchema>

export type CalculateXPRequest = z.infer<typeof calculateXPRequestSchema>
export type CalculateXPResponse = z.infer<typeof calculateXPResponseSchema>

export type CalculateSkillPointsRequest = z.infer<typeof calculateSkillPointsRequestSchema>
export type CalculateSkillPointsResponse = z.infer<typeof calculateSkillPointsResponseSchema>

export type RecalculateCharacterRequest = z.infer<typeof recalculateCharacterRequestSchema>
export type RecalculateCharacterResponse = z.infer<typeof recalculateCharacterResponseSchema>