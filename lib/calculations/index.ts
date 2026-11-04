// lib/calculations/index.ts

import { DEFAULT_VITALITY_PER_LEVEL } from '@/lib/constants/character'

// ============================================
// TIPOS PARA CÁLCULOS
// ============================================

export interface AttributeValue {
  race: number
  class: number
  bonus: number
}

export interface VitalityBase {
  race: number
  class: number
  perLevel: number
}

export interface SkillValue {
  distributed: number
  bonus: number
}

// ============================================
// CÁLCULOS DE ATRIBUTOS
// ============================================

/**
 * Bônus de nível dos atributos
 * Fórmula: level >= 5 ? Math.floor(level / 5) : 0
 */
export function getAttributeLevelBonus(level: number): number {
  return level >= 5 ? Math.floor(level / 5) : 0
}

/**
 * Calcular base do atributo, sem o bônus de nível
 * Fórmula: race + class + bonus
 */
export function calculateAttributeBase(attribute: AttributeValue): number {
  return attribute.race + attribute.class + attribute.bonus
}

/**
 * Calcular total de atributo
 * Fórmula: race + class + bonus + getAttributeLevelBonus(level)
 */
export function calculateAttributeTotal(attribute: AttributeValue, level: number): number {
  return calculateAttributeBase(attribute) + getAttributeLevelBonus(level)
}

/**
 * Calcular todos os atributos de uma vez
 */
export function calculateAllAttributes(attributes: Record<string, AttributeValue>, level: number) {
  const calculated: Record<string, number> = {}

  for (const [key, attribute] of Object.entries(attributes)) {
    calculated[key] = calculateAttributeTotal(attribute, level)
  }

  return calculated
}

// ============================================
// CÁLCULOS DE VITALIDADE
// ============================================

/**
 * Vitalidade máxima (total único)
 * Fórmula: race + class + perLevel × nível
 * Ex.: 3500 + 3500 + 700 × nível; nível 0 = só as bases
 */
export function calculateMaxVitality(vitality: VitalityBase, level: number): number {
  return vitality.race + vitality.class + vitality.perLevel * level
}

// currentVitality como vem do banco: `current` ausente ou null = vida cheia, chaves antigas permitidas
export type StoredCurrentVitality = { current?: number | null; [key: string]: unknown } | null | undefined

/**
 * Vitalidade atual do total único
 * Ausente ou null = vida cheia; sem teto: um atual acima do máximo (edição manual) é mantido
 */
export function resolveCurrentVitality(currentVitality: StoredCurrentVitality, max: number): number {
  const stored = currentVitality?.current
  return typeof stored === 'number' && Number.isFinite(stored) ? stored : max
}

// ============================================
// CÁLCULOS DE BERKANA
// ============================================

/**
 * Berkana base de todo personagem (nível 0, sem bônus)
 */
export function getBaseBerkana(): number {
  return 100
}

/**
 * Calcular Berkana máxima
 * Fórmula: baseValue + (level * 10) + bonus
 */
export function calculateMaxBerkana(level: number, baseValue: number, bonus: number): number {
  return baseValue + (level * 10) + bonus
}

// ============================================
// RECURSOS EM JOGO: VITALIDADE E BERKANA
// ============================================

// JsonValue recursivo, no mesmo formato que z.json() aceita
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

// type (não interface): precisa ser atribuível ao índice JSON de updateCharacterSchema
// para ir direto em mutateAsync, sem cast no chamador
export type CurrentVitalityValue = { current: number; [key: string]: JsonValue }

// Copia o objeto armazenado (chaves antigas e desconhecidas são mantidas) e define `current`
function withCurrent(currentVitality: StoredCurrentVitality, current: number): CurrentVitalityValue {
  // O objeto veio de uma coluna Json, então os valores são JSON
  return { ...(currentVitality ?? {}), current } as CurrentVitalityValue
}

/**
 * Dano: subtrai do atual, nunca abaixo de 0; devolve o payload completo, chaves antigas preservadas
 * Não valida damageAmount: quem chama envia um inteiro positivo.
 */
export function applyVitalityDamage(currentVitality: StoredCurrentVitality, max: number, damageAmount: number): CurrentVitalityValue {
  const current = resolveCurrentVitality(currentVitality, max)
  return withCurrent(currentVitality, Math.max(0, current - damageAmount))
}

/**
 * Cura por valor: soma até o máximo; nunca reduz um atual acima do máximo; máximo <= 0 não muda.
 * Mesma regra de recoverBerkana. Quem chama envia um inteiro positivo.
 */
export function applyVitalityHeal(currentVitality: StoredCurrentVitality, max: number, healAmount: number): CurrentVitalityValue {
  const current = resolveCurrentVitality(currentVitality, max)
  return withCurrent(currentVitality, Math.max(current, Math.min(max, current + healAmount)))
}

/**
 * Restaurar: atual = máximo (mínimo 0); devolve o payload completo, chaves antigas preservadas
 */
export function restoreVitality(currentVitality: StoredCurrentVitality, max: number): CurrentVitalityValue {
  return withCurrent(currentVitality, Math.max(0, max))
}

export type BerkanaStateKey = 'cheia' | 'metade' | 'esgotada' | 'disponivel'

export type BerkanaPool = { current: number; max: number }

/**
 * Berkana atual e máxima como o card mostra hoje.
 * Padrões só para undefined: maxBerkana 100, currentBerkana 100, berkanaBonus 0.
 * Máximo = maxBerkana || calculateMaxBerkana(level || 0, getBaseBerkana(), berkanaBonus || 0).
 * Atual = currentBerkana gravado (sem fallback para o máximo).
 */
export function resolveBerkanaPool({
  level,
  maxBerkana = 100,
  currentBerkana = 100,
  berkanaBonus = 0
}: {
  level?: number | null
  maxBerkana?: number | null
  currentBerkana?: number | null
  berkanaBonus?: number | null
}): BerkanaPool {
  const calculatedMax = calculateMaxBerkana(level || 0, getBaseBerkana(), berkanaBonus || 0)

  return {
    current: currentBerkana || 0,
    max: maxBerkana || calculatedMax
  }
}

/**
 * Gastar Berkana: nunca abaixo de 0. Com 30 e 50 reproduz os antigos botões -30 e -50.
 */
export function spendBerkana(current: number, amount: number): number {
  return Math.max(0, (current || 0) - amount)
}

/**
 * Recuperar Berkana: soma até o máximo, o mesmo teto que o campo "Atual" aceita ao editar.
 * Nunca reduz um valor que já está acima do máximo.
 */
export function recoverBerkana(current: number, max: number, amount: number): number {
  return Math.max(current || 0, Math.min(max, (current || 0) + amount))
}

/**
 * Estado da Berkana (primeira regra que casar):
 * esgotada (<= 0), cheia (>= máximo), metade (<= 50% do máximo), senão disponível.
 */
export function getBerkanaState(current: number, max: number): BerkanaStateKey {
  if (current <= 0) return 'esgotada'
  if (current >= max) return 'cheia'
  if (current / max <= 0.5) return 'metade'
  return 'disponivel'
}

// ============================================
// CÁLCULOS DE PERÍCIAS
// ============================================

/**
 * Bônus de nível das perícias
 * Fórmula: Math.floor(level / 5)
 */
export function getSkillLevelBonus(level: number): number {
  return Math.floor(level / 5)
}

/**
 * Calcular total de perícia
 * Fórmula: 1 + distributed + bonus + getSkillLevelBonus(level)
 */
export function calculateSkillTotal(skill: SkillValue, level: number): number {
  const base = 1
  return base + skill.distributed + skill.bonus + getSkillLevelBonus(level)
}

/**
 * Calcular todas as perícias de uma vez
 */
export function calculateAllSkills(skills: Record<string, SkillValue>, level: number) {
  const calculated: Record<string, number> = {}

  for (const [key, skill] of Object.entries(skills)) {
    calculated[key] = calculateSkillTotal(skill, level)
  }

  return calculated
}

/**
 * Calcular pontos de perícia disponíveis por nível
 */
export function getSkillPointsPerLevel(): number {
  return 10
}

/**
 * Calcular total de pontos gastos em perícias
 */
export function calculateUsedSkillPoints(skills: Record<string, SkillValue>): number {
  return Object.values(skills).reduce((total, skill) => total + skill.distributed, 0)
}

/**
 * Total de pontos de perícia da ficha, incluindo o nível 0
 * Fórmula: (level + 1) * getSkillPointsPerLevel()
 * Alimenta a aba de perícias ("Disponíveis"). Não é o mesmo pool de calculateLevelUpSkillPoints.
 */
export function calculateTotalSkillPoints(level: number): number {
  return (level + 1) * getSkillPointsPerLevel()
}

/**
 * Pontos de perícia ganhos por nível, sem contar o nível 0
 * Fórmula: level * getSkillPointsPerLevel()
 * Alimenta calculateAvailableSkillPoints, validateSkillDistribution e os hooks de stats do cliente.
 */
export function calculateLevelUpSkillPoints(level: number): number {
  return level * getSkillPointsPerLevel()
}

/**
 * Calcular pontos restantes de um pool informado (pode ser negativo)
 * Fórmula: totalPoints - calculateUsedSkillPoints(skills)
 */
export function calculateRemainingSkillPoints(skills: Record<string, SkillValue>, totalPoints: number): number {
  return totalPoints - calculateUsedSkillPoints(skills)
}

/**
 * Calcular pontos de perícia disponíveis para distribuir
 * Usa o pool de calculateLevelUpSkillPoints e nunca fica abaixo de zero
 */
export function calculateAvailableSkillPoints(skills: Record<string, SkillValue>, level: number): number {
  return Math.max(0, calculateRemainingSkillPoints(skills, calculateLevelUpSkillPoints(level)))
}

// ============================================
// CÁLCULOS DE XP E NÍVEL
// ============================================

/**
 * Calcular XP necessário para próximo nível
 * Fórmula: (currentLevel + 1) * 10
 */
export function getXPRequiredForNextLevel(currentLevel: number): number {
  return (currentLevel + 1) * 10
}

/**
 * Calcular XP total necessário para um nível específico
 */
export function getTotalXPForLevel(targetLevel: number): number {
  let totalXP = 0
  for (let level = 0; level < targetLevel; level++) {
    totalXP += getXPRequiredForNextLevel(level)
  }
  return totalXP
}

// ============================================
// VALIDAÇÕES
// ============================================

/**
 * Validar se pode subir de nível
 */
export function canLevelUp(currentXP: number, currentLevel: number): boolean {
  const xpRequired = getXPRequiredForNextLevel(currentLevel)
  return currentXP >= xpRequired && currentLevel < 99
}

/**
 * Validar distribuição de pontos de perícia
 * Máximo 3 pontos por perícia por nível
 */
export function validateSkillDistribution(skills: Record<string, SkillValue>, level: number): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  const maxPointsPerSkillPerLevel = 3
  const maxPointsPerSkill = level * maxPointsPerSkillPerLevel
  const totalAvailable = calculateLevelUpSkillPoints(level)
  const totalUsed = calculateUsedSkillPoints(skills)

  // Verificar se não ultrapassou o total disponível
  if (totalUsed > totalAvailable) {
    errors.push(`Total de pontos usado (${totalUsed}) excede o disponível (${totalAvailable})`)
  }

  // Verificar cada perícia individualmente
  for (const [skillName, skill] of Object.entries(skills)) {
    if (skill.distributed > maxPointsPerSkill) {
      errors.push(`${skillName}: ${skill.distributed} pontos excedem o máximo de ${maxPointsPerSkill}`)
    }

    if (skill.distributed < 0) {
      errors.push(`${skillName}: pontos distribuídos não podem ser negativos`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// ============================================
// FUNÇÃO DE LEVEL UP
// ============================================

/**
 * Processar level up de um personagem
 * Retorna as atualizações necessárias
 */
export function processLevelUp(currentData: {
  level: number
  currentXP: number
  vitality: VitalityBase
  maxBerkana: number
  berkanaBonus: number
}) {
  const { level, currentXP, vitality, berkanaBonus } = currentData

  if (!canLevelUp(currentXP, level)) {
    throw new Error('XP insuficiente para subir de nível')
  }

  const newLevel = level + 1
  const xpUsed = getXPRequiredForNextLevel(level)
  const newCurrentXP = currentXP - xpUsed

  // Recalcular stats derivados
  const newMaxVitality = calculateMaxVitality(vitality, newLevel)
  const newMaxBerkana = calculateMaxBerkana(newLevel, getBaseBerkana(), berkanaBonus)

  return {
    level: newLevel,
    currentXP: newCurrentXP,
    maxBerkana: newMaxBerkana,
    // Vitalidade atual se mantém, apenas o máximo muda
    maxVitality: newMaxVitality,
    // Retornar info adicional
    xpUsedForLevelUp: xpUsed,
    newSkillPointsAvailable: getSkillPointsPerLevel()
  }
}

// ============================================
// NORMALIZAÇÃO DE ENTRADAS
// ============================================

/**
 * Normalizar atributo vindo de JSON solto
 * Campos ausentes, nulos, NaN ou vazios viram 0 (regra `|| 0`)
 */
export function toAttributeValue(raw: Partial<AttributeValue> | null | undefined): AttributeValue {
  return {
    race: raw?.race || 0,
    class: raw?.class || 0,
    bonus: raw?.bonus || 0
  }
}

/**
 * Normalizar perícia vinda de JSON solto
 * Campos ausentes, nulos, NaN ou vazios viram 0 (regra `|| 0`)
 */
export function toSkillValue(raw: Partial<SkillValue> | null | undefined): SkillValue {
  return {
    distributed: raw?.distributed || 0,
    bonus: raw?.bonus || 0
  }
}

/**
 * Normalizar vitalidade base vinda de JSON solto
 * race e class: campos ausentes, nulos, NaN ou vazios viram 0 (regra `|| 0`)
 * perLevel: o número gravado quando é finito (0 incluído); ausente, nulo ou não finito vira 700
 */
export function toVitalityBase(raw: Partial<VitalityBase> | null | undefined): VitalityBase {
  const perLevel = raw?.perLevel
  return {
    race: raw?.race || 0,
    class: raw?.class || 0,
    perLevel: typeof perLevel === 'number' && Number.isFinite(perLevel) ? perLevel : DEFAULT_VITALITY_PER_LEVEL
  }
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Obter lista de todas as perícias padrão
 */
export function getDefaultSkills(): string[] {
  return [
    'acrobacia', 'atuacao', 'avaliar', 'ataqueSurpresa', 'blefar',
    'concentracao', 'controleArcano', 'controleEmocional', 'combateDesarmado',
    'conhecimentoArcano', 'conhecimentoPolitico', 'conhecimentoHistorico',
    'conhecimentoReligioso', 'conhecimentoNatureza', 'conhecimentoMilitar',
    'cura', 'cavalgar', 'duelo', 'dissuadir', 'diplomacia', 'discernir',
    'dissimulacao', 'empatia', 'escalar', 'equilibrio', 'furtar',
    'furtividade', 'nadar', 'oficios', 'percepcao', 'prontidao',
    'persuadir', 'sobrevivencia', 'suportar', 'salvar', 'velocidade'
  ]
}

/**
 * Inicializar perícias com valores zerados
 */
export function initializeSkills(): Record<string, SkillValue> {
  const skills: Record<string, SkillValue> = {}

  getDefaultSkills().forEach(skillName => {
    skills[skillName] = {
      distributed: 0,
      bonus: 0
    }
  })

  return skills
}