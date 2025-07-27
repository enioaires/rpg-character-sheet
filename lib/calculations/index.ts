// lib/calculations/index.ts

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
}

export interface VitalityLevels {
  notavel: number
  ferido: number
  gravementeFerido: number
  condenado: number
  incapacitado: number
  coma: number
}

export interface SkillValue {
  distributed: number
  bonus: number
}

// ============================================
// CÁLCULOS DE ATRIBUTOS
// ============================================

/**
 * Calcular total de atributo
 * Fórmula: race + class + bonus + (level >= 5 ? Math.floor(level / 5) : 0)
 */
export function calculateAttributeTotal(attribute: AttributeValue, level: number): number {
  const levelBonus = level >= 5 ? Math.floor(level / 5) : 0
  return attribute.race + attribute.class + attribute.bonus + levelBonus
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
 * Calcular vitalidade máxima por nível
 * Fórmula: cada nível multiplicado por (nível atual + 1)
 */
export function calculateVitalityLevels(vitality: VitalityBase, level: number): VitalityLevels {
  const baseTotal = vitality.race + vitality.class

  const baseLevels = {
    notavel: baseTotal,
    ferido: baseTotal - 20,
    gravementeFerido: baseTotal - 40,
    condenado: baseTotal - 60,
    incapacitado: baseTotal - 80,
    coma: baseTotal - 100
  }

  // Multiplicar cada nível pela fórmula (nível atual + 1)
  const multiplier = level + 1

  return {
    notavel: baseLevels.notavel * multiplier,
    ferido: baseLevels.ferido * multiplier,
    gravementeFerido: baseLevels.gravementeFerido * multiplier,
    condenado: baseLevels.condenado * multiplier,
    incapacitado: baseLevels.incapacitado * multiplier,
    coma: baseLevels.coma * multiplier
  }
}

// ============================================
// CÁLCULOS DE BERKANA
// ============================================

/**
 * Calcular Berkana máxima
 * Fórmula: baseValue + (level * 10) + bonus
 */
export function calculateMaxBerkana(level: number, baseValue: number, bonus: number): number {
  return baseValue + (level * 10) + bonus
}

// ============================================
// CÁLCULOS DE PERÍCIAS
// ============================================

/**
 * Calcular total de perícia
 * Fórmula: 1 + distributed + bonus + Math.floor(level / 5)
 */
export function calculateSkillTotal(skill: SkillValue, level: number): number {
  const base = 1
  const levelBonus = Math.floor(level / 5)
  return base + skill.distributed + skill.bonus + levelBonus
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
 * Calcular pontos de perícia disponíveis para distribuir
 */
export function calculateAvailableSkillPoints(skills: Record<string, SkillValue>, level: number): number {
  const totalAvailable = level * getSkillPointsPerLevel()
  const totalUsed = calculateUsedSkillPoints(skills)
  return Math.max(0, totalAvailable - totalUsed)
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
  const totalAvailable = level * getSkillPointsPerLevel()
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
  const { level, currentXP, vitality, maxBerkana, berkanaBonus } = currentData

  if (!canLevelUp(currentXP, level)) {
    throw new Error('XP insuficiente para subir de nível')
  }

  const newLevel = level + 1
  const xpUsed = getXPRequiredForNextLevel(level)
  const newCurrentXP = currentXP - xpUsed

  // Recalcular stats derivados
  const newVitalityLevels = calculateVitalityLevels(vitality, newLevel)
  const newMaxBerkana = calculateMaxBerkana(newLevel, 100, berkanaBonus) // Base de 100

  return {
    level: newLevel,
    currentXP: newCurrentXP,
    maxBerkana: newMaxBerkana,
    // Vitalidade atual se mantém, apenas o máximo muda
    vitalityLevels: newVitalityLevels,
    // Retornar info adicional
    xpUsedForLevelUp: xpUsed,
    newSkillPointsAvailable: getSkillPointsPerLevel()
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