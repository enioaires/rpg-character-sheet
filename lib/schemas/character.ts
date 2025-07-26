import { z } from 'zod'

// Schema para query parameters do GET /characters
export const getCharactersQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().optional(),
})

// Schema de resposta do GET /characters (para tipagem)
export const characterListItemSchema = z.object({
  id: z.string(),
  playerName: z.string().nullable(),
  characterName: z.string(),
  class: z.string().nullable(),
  race: z.string().nullable(),
  level: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const getCharactersResponseSchema = z.object({
  characters: z.array(characterListItemSchema),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
})

// Schema para parâmetro do GET /characters/:id
export const getCharacterParamsSchema = z.object({
  id: z.string().min(1),
})

// Schema de resposta completa do personagem
export const characterFullSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Informações Básicas
  playerName: z.string().nullable(),
  characterName: z.string(),
  class: z.string().nullable(),
  race: z.string().nullable(),
  deity: z.string().nullable(),
  homeland: z.string().nullable(),
  alignment: z.string().nullable(),
  gender: z.string().nullable(),
  age: z.string().nullable(),
  weight: z.string().nullable(),
  height: z.string().nullable(),
  virtuePoints: z.string().nullable(),
  // Nível e XP
  level: z.number(),
  currentXP: z.number(),
  // Dados Json
  attributes: z.any(), // Json do Prisma
  vitality: z.any(),
  currentVitality: z.any(),
  maxBerkana: z.number(),
  currentBerkana: z.number(),
  berkanaBonus: z.number(),
  skills: z.any(),
  weapons: z.any(),
  armor: z.any(),
  adventureKit: z.any(),
  finances: z.any(),
  languages: z.any(),
  spells: z.any(),
  talents: z.any(),
  notes: z.string().nullable(),
})

export const getCharacterResponseSchema = z.object({
  character: characterFullSchema,
})

// Schema para criação de personagem - APENAS campos obrigatórios
export const createCharacterSchema = z.object({
  characterName: z.string().min(1, 'Nome do personagem é obrigatório'),
  playerName: z.string().optional(),
  class: z.string().optional(),
  race: z.string().optional(),
  deity: z.string().optional(),
  homeland: z.string().optional(),
  alignment: z.string().optional(),
  gender: z.string().optional(),
  age: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  virtuePoints: z.string().optional(),
  notes: z.string().optional(),
})

export const createCharacterResponseSchema = z.object({
  character: characterFullSchema,
  message: z.string(),
})

// Schema para atualização de personagem - todos os campos opcionais
export const updateCharacterSchema = z.object({
  // Informações Básicas
  playerName: z.string().optional(),
  characterName: z.string().min(1).optional(),
  class: z.string().optional(),
  race: z.string().optional(),
  deity: z.string().optional(),
  homeland: z.string().optional(),
  alignment: z.string().optional(),
  gender: z.string().optional(),
  age: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  virtuePoints: z.string().optional(),
  // Nível e XP
  level: z.number().min(0).max(99).optional(),
  currentXP: z.number().min(0).optional(),
  // Berkana
  maxBerkana: z.number().min(0).optional(),
  currentBerkana: z.number().min(0).optional(),
  berkanaBonus: z.number().optional(),
  // Dados Json (aceitar qualquer estrutura)
  attributes: z.any().optional(),
  vitality: z.any().optional(),
  currentVitality: z.any().optional(),
  skills: z.any().optional(),
  weapons: z.any().optional(),
  armor: z.any().optional(),
  adventureKit: z.any().optional(),
  finances: z.any().optional(),
  languages: z.any().optional(),
  spells: z.any().optional(),
  talents: z.any().optional(),
  notes: z.string().optional(),
})

export const updateCharacterResponseSchema = z.object({
  character: characterFullSchema,
  message: z.string(),
})

export const deleteCharacterResponseSchema = z.object({
  message: z.string(),
})

export type DeleteCharacterResponse = z.infer<typeof deleteCharacterResponseSchema>

export type UpdateCharacterRequest = z.infer<typeof updateCharacterSchema>
export type UpdateCharacterResponse = z.infer<typeof updateCharacterResponseSchema>
export type GetCharactersQuery = z.infer<typeof getCharactersQuerySchema>
export type CharacterListItem = z.infer<typeof characterListItemSchema>
export type GetCharactersResponse = z.infer<typeof getCharactersResponseSchema>
export type GetCharacterParams = z.infer<typeof getCharacterParamsSchema>
export type CharacterFull = z.infer<typeof characterFullSchema>
export type GetCharacterResponse = z.infer<typeof getCharacterResponseSchema>
export type CreateCharacterRequest = z.infer<typeof createCharacterSchema>
export type CreateCharacterResponse = z.infer<typeof createCharacterResponseSchema>