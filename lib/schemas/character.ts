import { z } from 'zod'
import {
  attributeValueSchema,
  skillValueSchema,
  vitalityBaseSchema,
  vitalityLevelsSchema,
} from '@/lib/schemas/calculations'

// Limites de paginação: page <= 10000 mantém o skip do Prisma abaixo de 999.900
export const DEFAULT_CHARACTERS_PAGE_SIZE = 10
export const MAX_CHARACTERS_PAGE_SIZE = 100
export const MAX_CHARACTERS_PAGE = 10_000

// Converte para inteiro base 10; valor não numérico vira fallback, o resto é limitado a min..max
export function parseClampedInt(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

// Schema para query parameters do GET /characters
export const getCharactersQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => parseClampedInt(val, 1, 1, MAX_CHARACTERS_PAGE)),
  limit: z
    .string()
    .optional()
    .transform(val =>
      parseClampedInt(val, DEFAULT_CHARACTERS_PAGE_SIZE, 1, MAX_CHARACTERS_PAGE_SIZE),
    ),
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

// ============================================
// CAMPOS JSON
// ============================================
// Política de tolerância: toda chave declarada é opcional, chaves desconhecidas
// (dados legados) são preservadas, as folhas têm o tipo checado e não há
// limites de faixa além dos dois fundamentados (distributed >= 0 e armas <= 3).
// Nunca usar o modo strip: a rota grava a saída validada e apagaria dados antigos.
// .loose()/.passthrough() não servem: o índice `unknown` não é aceito pelo Prisma.
const jsonExtra = z.json()

const jsonObject = <T extends z.ZodRawShape>(shape: T) =>
  z.object(shape).catchall(jsonExtra)

export const weaponDamageSchema = jsonObject({
  d25: z.string().optional(),
  d50: z.string().optional(),
  d75: z.string().optional(),
  d100: z.string().optional(),
  critical: z.string().optional(),
})

export const weaponSchema = jsonObject({
  name: z.string().optional(),
  level: z.number().optional(),
  damage: weaponDamageSchema.optional(),
  description: z.string().optional(),
})

// Itens nulos: buildUpdateData gera array esparso quando uma arma posterior é editada primeiro
export const weaponsFieldSchema = z.array(weaponSchema.nullable()).max(3)

// Entradas parciais: buildUpdateData grava só a chave editada quando o registro salvo não a tem
export const attributesFieldSchema = z.record(
  z.string(),
  attributeValueSchema.partial().catchall(jsonExtra),
)

export const vitalityFieldSchema = vitalityBaseSchema.partial().catchall(jsonExtra)

// Sem mínimo: restoreFullHealth grava estágios negativos quando raça + classe < 100
export const currentVitalityFieldSchema = vitalityLevelsSchema.partial().catchall(jsonExtra)

// distributed >= 0 é garantido por todos os escritores de perícias
export const skillsFieldSchema = z.record(
  z.string(),
  skillValueSchema.partial().catchall(jsonExtra),
)

export const armorFieldSchema = jsonObject({
  name: z.string().optional(),
  description: z.string().optional(),
  totalVitality: z.number().optional(),
  currentVitality: z.number().optional(),
})

export const adventureKitItemSchema = jsonObject({
  name: z.string().optional(),
  quantity: z.number().optional(),
  isDefault: z.boolean().optional(),
})

export const adventureKitFieldSchema = z.array(adventureKitItemSchema)

export const financesFieldSchema = jsonObject({
  ouro: z.number().optional(),
  prata: z.number().optional(),
  cobre: z.number().optional(),
  imperano: z.number().optional(),
  joias: z.number().optional(),
})

export const customLanguageSchema = jsonObject({
  name: z.string().optional(),
  known: z.boolean().optional(),
})

// custom aceita array ou objeto indexado ("0", "1", ...): editar o nome de um idioma
// pelo buildUpdateData (caminho de 3 segmentos) transforma o array em objeto
export const languagesFieldSchema = jsonObject({
  standard: z.record(z.string(), z.boolean()).optional(),
  custom: z
    .union([z.array(customLanguageSchema), z.record(z.string(), customLanguageSchema)])
    .optional(),
})

// Espelha normalizeScalingData: objeto { base, perLevel }, string legada, número ou null
export const scalingValueSchema = z.union([
  jsonObject({
    base: z.union([z.number(), z.string()]).optional(),
    perLevel: z.number().nullable().optional(),
  }),
  z.string(),
  z.number(),
  z.null(),
])

export const spellSchema = jsonObject({
  name: z.string().optional(),
  type: z.string().optional(),
  concentration: z.string().optional(),
  prepTime: z.string().optional(),
  resistance: z.string().optional(),
  range: z.string().optional(),
  description: z.string().optional(),
  level: z.number().optional(),
  berkanaCost: z.number().optional(),
  damage: scalingValueSchema.optional(),
  duration: scalingValueSchema.optional(),
})

export const spellsFieldSchema = z.array(spellSchema)

export const talentSchema = jsonObject({
  name: z.string().optional(),
  description: z.string().optional(),
  level: z.number().optional(),
  oncePerDay: z.boolean().optional(),
  usedToday: z.boolean().optional(),
})

export const talentsFieldSchema = z.array(talentSchema)

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
  // Dados Json
  attributes: attributesFieldSchema.optional(),
  vitality: vitalityFieldSchema.optional(),
  currentVitality: currentVitalityFieldSchema.optional(),
  skills: skillsFieldSchema.optional(),
  weapons: weaponsFieldSchema.optional(),
  armor: armorFieldSchema.optional(),
  adventureKit: adventureKitFieldSchema.optional(),
  finances: financesFieldSchema.optional(),
  languages: languagesFieldSchema.optional(),
  spells: spellsFieldSchema.optional(),
  talents: talentsFieldSchema.optional(),
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