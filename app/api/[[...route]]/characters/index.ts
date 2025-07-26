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
export default app;