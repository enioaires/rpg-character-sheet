import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  getCharactersQuerySchema,
  getCharactersResponseSchema,
  getCharacterParamsSchema,
  getCharacterResponseSchema,
  createCharacterSchema,
  createCharacterResponseSchema,
  updateCharacterSchema,
  updateCharacterResponseSchema,
  deleteCharacterResponseSchema
} from "@/lib/schemas/character";
import {
  levelUpResponseSchema,
  calculateVitalityRequestSchema,
  calculateVitalityResponseSchema,
  calculateBerkanaRequestSchema,
  calculateBerkanaResponseSchema,
  validateSkillsRequestSchema,
  validateSkillsResponseSchema,
  calculateAttributesRequestSchema,
  calculateAttributesResponseSchema,
  calculateXPRequestSchema,
  calculateXPResponseSchema,
  calculateSkillPointsRequestSchema,
  calculateSkillPointsResponseSchema,
  recalculateCharacterResponseSchema
} from "@/lib/schemas/calculations";

import {
  processLevelUp,
  calculateVitalityLevels,
  calculateMaxBerkana,
  validateSkillDistribution,
  calculateAllAttributes,
  calculateAllSkills,
  getXPRequiredForNextLevel,
  getTotalXPForLevel,
  calculateAvailableSkillPoints,
  calculateUsedSkillPoints,
  getSkillPointsPerLevel
} from "@/lib/calculations";
import { db } from "@/lib/db";
import { getDefaultCharacterData } from "@/lib/defaults/character";

const app = new Hono()
  .get(
    '/',
    zValidator('query', getCharactersQuerySchema),
    async (c) => {
      try {
        const { page, limit, search } = c.req.valid('query')

        const where = search
          ? {
            OR: [
              { characterName: { contains: search, mode: 'insensitive' as const } },
              { playerName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
          : {}

        const characters = await db.character.findMany({
          where,
          select: {
            id: true,
            playerName: true,
            characterName: true,
            class: true,
            race: true,
            level: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc'
          },
          skip: (page - 1) * limit,
          take: limit,
        })

        const total = await db.character.count({ where })

        const response = getCharactersResponseSchema.parse({
          characters,
          total,
          page,
          limit,
        })

        return c.json(response)
      } catch (error) {
        console.error('Error fetching characters:', error)
        return c.json({ error: 'Failed to fetch characters' }, 500)
      }
    }
  )
  .get(
    '/:id',
    zValidator('param', getCharacterParamsSchema),
    async (c) => {
      try {
        const { id } = c.req.valid('param')

        const character = await db.character.findUnique({
          where: { id }
        })

        if (!character) {
          return c.json({ error: 'Character not found' }, 404)
        }

        const response = getCharacterResponseSchema.parse({
          character,
        })

        return c.json(response)
      } catch (error) {
        console.error('Error fetching character:', error)
        return c.json({ error: 'Failed to fetch character' }, 500)
      }
    }
  )
  .post(
    '/',
    zValidator('json', createCharacterSchema),
    async (c) => {
      try {
        const input = c.req.valid('json')

        // Mesclar dados do usuário com defaults
        const defaultData = getDefaultCharacterData()
        const characterData = {
          ...input,
          ...defaultData,
        }

        const character = await db.character.create({
          data: characterData
        })

        const response = createCharacterResponseSchema.parse({
          character,
          message: 'Personagem criado com sucesso',
        })

        return c.json(response, 201)
      } catch (error) {
        console.error('Error creating character:', error)
        return c.json({ error: 'Failed to create character' }, 500)
      }
    }
  )
  .put(
    '/:id',
    zValidator('param', getCharacterParamsSchema),
    zValidator('json', updateCharacterSchema),
    async (c) => {
      try {
        const { id } = c.req.valid('param')
        const updates = c.req.valid('json')

        // Verificar se personagem existe
        const existingCharacter = await db.character.findUnique({
          where: { id }
        })

        if (!existingCharacter) {
          return c.json({ error: 'Character not found' }, 404)
        }

        // Atualizar apenas os campos enviados
        const character = await db.character.update({
          where: { id },
          data: updates
        })

        const response = updateCharacterResponseSchema.parse({
          character,
          message: 'Personagem atualizado com sucesso',
        })

        return c.json(response)
      } catch (error) {
        console.error('Error updating character:', error)
        return c.json({ error: 'Failed to update character' }, 500)
      }
    }
  )
  .delete(
    '/:id',
    zValidator('param', getCharacterParamsSchema),
    async (c) => {
      try {
        const { id } = c.req.valid('param')

        // Verificar se personagem existe
        const existingCharacter = await db.character.findUnique({
          where: { id }
        })

        if (!existingCharacter) {
          return c.json({ error: 'Character not found' }, 404)
        }

        // Deletar personagem
        await db.character.delete({
          where: { id }
        })

        const response = deleteCharacterResponseSchema.parse({
          message: 'Personagem deletado com sucesso',
        })

        return c.json(response)
      } catch (error) {
        console.error('Error deleting character:', error)
        return c.json({ error: 'Failed to delete character' }, 500)
      }
    }
  )
  .post(
    '/:id/level-up',
    zValidator('param', getCharacterParamsSchema),
    async (c) => {
      try {
        const { id } = c.req.valid('param')

        // Buscar personagem atual
        const character = await db.character.findUnique({
          where: { id }
        })

        if (!character) {
          return c.json({ error: 'Character not found' }, 404)
        }

        // Processar level up
        const levelUpData = processLevelUp({
          level: character.level,
          currentXP: character.currentXP,
          vitality: character.vitality as any,
          maxBerkana: character.maxBerkana,
          berkanaBonus: character.berkanaBonus
        })

        // Atualizar personagem no banco
        const updatedCharacter = await db.character.update({
          where: { id },
          data: {
            level: levelUpData.level,
            currentXP: levelUpData.currentXP,
            maxBerkana: levelUpData.maxBerkana
          }
        })

        const response = levelUpResponseSchema.parse({
          success: true,
          message: `Personagem subiu para o nível ${levelUpData.level}!`,
          data: {
            oldLevel: character.level,
            newLevel: levelUpData.level,
            oldCurrentXP: character.currentXP,
            newCurrentXP: levelUpData.currentXP,
            xpUsedForLevelUp: levelUpData.xpUsedForLevelUp,
            newSkillPointsAvailable: levelUpData.newSkillPointsAvailable,
            newMaxBerkana: levelUpData.maxBerkana,
            newVitalityLevels: levelUpData.vitalityLevels,
          }
        })

        return c.json(response)
      } catch (error) {
        console.error('Error in level up:', error)
        return c.json({
          error: error instanceof Error ? error.message : 'Failed to level up character'
        }, 500)
      }
    }
  )
  .post(
    '/:id/calculate-vitality',
    zValidator('param', getCharacterParamsSchema),
    zValidator('json', calculateVitalityRequestSchema),
    async (c) => {
      try {
        const { id } = c.req.valid('param')
        const { vitality, level } = c.req.valid('json')

        // Verificar se personagem existe
        const character = await db.character.findUnique({
          where: { id }
        })

        if (!character) {
          return c.json({ error: 'Character not found' }, 404)
        }

        // Calcular vitalidade
        const vitalityLevels = calculateVitalityLevels(vitality, level)
        const baseTotal = vitality.race + vitality.class
        const multiplier = level + 1

        const response = calculateVitalityResponseSchema.parse({
          success: true,
          message: 'Vitalidade calculada com sucesso',
          data: {
            level,
            vitalityBase: vitality,
            vitalityLevels,
            calculations: {
              baseTotal,
              multiplier,
              formula: `(${vitality.race} + ${vitality.class}) * ${multiplier}`
            }
          }
        })

        return c.json(response)
      } catch (error) {
        console.error('Error calculating vitality:', error)
        return c.json({ error: 'Failed to calculate vitality' }, 500)
      }
    }
  )
  .post(
    '/:id/calculate-berkana',
    zValidator('param', getCharacterParamsSchema),
    zValidator('json', calculateBerkanaRequestSchema),
    async (c) => {
      try {
        const { id } = c.req.valid('param')
        const { level, baseValue, bonus } = c.req.valid('json')

        // Verificar se personagem existe
        const character = await db.character.findUnique({
          where: { id }
        })

        if (!character) {
          return c.json({ error: 'Character not found' }, 404)
        }

        // Calcular berkana
        const maxBerkana = calculateMaxBerkana(level, baseValue, bonus)
        const levelBonus = level * 10

        const response = calculateBerkanaResponseSchema.parse({
          success: true,
          message: 'Berkana calculada com sucesso',
          data: {
            level,
            baseValue,
            bonus,
            maxBerkana,
            calculations: {
              levelBonus,
              formula: `${baseValue} + (${level} * 10) + ${bonus} = ${maxBerkana}`
            }
          }
        })

        return c.json(response)
      } catch (error) {
        console.error('Error calculating berkana:', error)
        return c.json({ error: 'Failed to calculate berkana' }, 500)
      }
    }
  )
  .post(
    '/:id/validate-skills',
    zValidator('param', getCharacterParamsSchema),
    zValidator('json', validateSkillsRequestSchema),
    async (c) => {
      try {
        const { id } = c.req.valid('param')
        const { skills, level } = c.req.valid('json')

        // Verificar se personagem existe
        const character = await db.character.findUnique({
          where: { id }
        })

        if (!character) {
          return c.json({ error: 'Character not found' }, 404)
        }

        // Validar perícias
        const validation = validateSkillDistribution(skills, level)
        const skillTotals = calculateAllSkills(skills, level)
        const totalAvailable = level * getSkillPointsPerLevel()
        const totalUsed = calculateUsedSkillPoints(skills)
        const skillsWithIssues = validation.errors
          .filter(error => error.includes(':'))
          .map(error => error.split(':')[0])

        const response = validateSkillsResponseSchema.parse({
          success: true,
          message: validation.isValid ? 'Distribuição de perícias válida' : 'Encontrados problemas na distribuição',
          data: {
            isValid: validation.isValid,
            errors: validation.errors,
            summary: {
              totalAvailable,
              totalUsed,
              totalRemaining: totalAvailable - totalUsed,
              skillsWithIssues
            },
            skillTotals
          }
        })

        return c.json(response)
      } catch (error) {
        console.error('Error validating skills:', error)
        return c.json({ error: 'Failed to validate skills' }, 500)
      }
    }
  )
  .post(
    '/:id/calculate-attributes',
    zValidator('param', getCharacterParamsSchema),
    zValidator('json', calculateAttributesRequestSchema),
    async (c) => {
      try {
        const { id } = c.req.valid('param')
        const { attributes, level } = c.req.valid('json')

        // Verificar se personagem existe
        const character = await db.character.findUnique({
          where: { id }
        })

        if (!character) {
          return c.json({ error: 'Character not found' }, 404)
        }

        // Calcular atributos
        const attributeTotals = calculateAllAttributes(attributes, level)
        const levelBonus = level >= 5 ? Math.floor(level / 5) : 0

        const response = calculateAttributesResponseSchema.parse({
          success: true,
          message: 'Atributos calculados com sucesso',
          data: {
            level,
            attributeTotals,
            calculations: {
              levelBonus,
              formula: `race + class + bonus + ${levelBonus}`
            }
          }
        })

        return c.json(response)
      } catch (error) {
        console.error('Error calculating attributes:', error)
        return c.json({ error: 'Failed to calculate attributes' }, 500)
      }
    }
  )
  .post(
    '/:id/calculate-xp',
    zValidator('param', getCharacterParamsSchema),
    zValidator('json', calculateXPRequestSchema),
    async (c) => {
      try {
        const { id } = c.req.valid('param')
        const { currentLevel } = c.req.valid('json')

        // Verificar se personagem existe
        const character = await db.character.findUnique({
          where: { id }
        })

        if (!character) {
          return c.json({ error: 'Character not found' }, 404)
        }

        // Calcular XP
        const xpRequiredForNext = getXPRequiredForNextLevel(currentLevel)
        const totalXPForCurrentLevel = getTotalXPForLevel(currentLevel)
        const totalXPForNextLevel = getTotalXPForLevel(currentLevel + 1)

        const response = calculateXPResponseSchema.parse({
          success: true,
          message: 'XP calculado com sucesso',
          data: {
            currentLevel,
            xpRequiredForNext,
            totalXPForCurrentLevel,
            totalXPForNextLevel,
            maxLevel: 99
          }
        })

        return c.json(response)
      } catch (error) {
        console.error('Error calculating XP:', error)
        return c.json({ error: 'Failed to calculate XP' }, 500)
      }
    }
  )
  .post(
    '/:id/calculate-skill-points',
    zValidator('param', getCharacterParamsSchema),
    zValidator('json', calculateSkillPointsRequestSchema),
    async (c) => {
      try {
        const { id } = c.req.valid('param')
        const { skills, level } = c.req.valid('json')

        // Verificar se personagem existe
        const character = await db.character.findUnique({
          where: { id }
        })

        if (!character) {
          return c.json({ error: 'Character not found' }, 404)
        }

        // Calcular pontos de perícia
        const pointsPerLevel = getSkillPointsPerLevel()
        const totalAvailable = level * pointsPerLevel
        const totalUsed = calculateUsedSkillPoints(skills)
        const totalRemaining = calculateAvailableSkillPoints(skills, level)
        const skillTotals = calculateAllSkills(skills, level)

        // Breakdown por perícia
        const distributed: Record<string, number> = {}
        Object.entries(skills).forEach(([key, skill]) => {
          distributed[key] = skill.distributed
        })

        const response = calculateSkillPointsResponseSchema.parse({
          success: true,
          message: 'Pontos de perícia calculados com sucesso',
          data: {
            level,
            pointsPerLevel,
            totalAvailable,
            totalUsed,
            totalRemaining,
            breakdown: {
              distributed,
              totals: skillTotals
            }
          }
        })

        return c.json(response)
      } catch (error) {
        console.error('Error calculating skill points:', error)
        return c.json({ error: 'Failed to calculate skill points' }, 500)
      }
    }
  )
  .post(
    '/:id/recalculate',
    zValidator('param', getCharacterParamsSchema),
    async (c) => {
      try {
        const { id } = c.req.valid('param')

        // Buscar personagem completo
        const character = await db.character.findUnique({
          where: { id }
        })

        if (!character) {
          return c.json({ error: 'Character not found' }, 404)
        }

        // Recalcular tudo
        const level = character.level
        const attributes = character.attributes as any
        const vitality = character.vitality as any
        const skills = character.skills as any

        const calculatedAttributes = calculateAllAttributes(attributes, level)
        const calculatedVitality = calculateVitalityLevels(vitality, level)
        const calculatedBerkana = calculateMaxBerkana(level, 100, character.berkanaBonus)
        const calculatedSkills = calculateAllSkills(skills, level)
        const skillValidation = validateSkillDistribution(skills, level)
        const pointsRemaining = calculateAvailableSkillPoints(skills, level)

        const response = recalculateCharacterResponseSchema.parse({
          success: true,
          message: 'Personagem recalculado com sucesso',
          data: {
            level,
            calculatedAttributes,
            calculatedVitality,
            calculatedBerkana,
            calculatedSkills,
            skillValidation: {
              isValid: skillValidation.isValid,
              errors: skillValidation.errors,
              pointsRemaining
            }
          }
        })

        return c.json(response)
      } catch (error) {
        console.error('Error recalculating character:', error)
        return c.json({ error: 'Failed to recalculate character' }, 500)
      }
    }
  )
export default app;