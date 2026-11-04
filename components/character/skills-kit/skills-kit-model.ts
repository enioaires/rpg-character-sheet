// components/character/skills-kit/skills-kit-model.ts
// Modelo de apresentação da aba Perícias e Kit (DS-05). Sem React, sonner ou Hono:
// só compõe lib/calculations e monta os payloads das gravações.
import {
  calculateRemainingSkillPoints,
  calculateSkillTotal,
  calculateTotalSkillPoints,
  calculateUsedSkillPoints,
  getSkillDistributionCap,
  getSkillLevelBonus,
  toSkillValue,
  type SkillValue,
  type StoredAttributes,
} from '@/lib/calculations'
import {
  ATTRIBUTE_ABBREVIATIONS,
  DEFAULT_ADVENTURE_KIT,
  SKILLS,
  SKILL_ATTRIBUTES,
  SKILL_LABELS,
  type SkillKey,
} from '@/lib/constants/character'
import type { AdventureKitItem, UpdateCharacterRequest } from '@/lib/schemas/character'

// A definição mora em lib/constants/character; reexportada para os imports atuais
export type { SkillKey }
export type SkillFilter = 'uso' | 'todas'
export type SkillStepField = 'distributed' | 'bonus'

// JSON solto da coluna skills: chaves extras sobrevivem porque os objetos são espalhados, nunca reconstruídos
export type StoredSkills = Record<string, Partial<SkillValue> | null | undefined>

// ============================================
// GRUPOS DE PERÍCIAS
// ============================================

// Só apresentação: as chaves são as grafias de SKILLS. O descompasso com as chaves
// guardadas (atuação x atuacao, ataqueSupresa x ataqueSurpresa...) NÃO é corrigido aqui.
export const SKILL_GROUPS: ReadonlyArray<{ name: string; skills: readonly SkillKey[] }> = [
  { name: 'Combate', skills: ['ataqueSupresa', 'combateDesarmado', 'duelo'] },
  {
    name: 'Físicas',
    skills: ['acrobacia', 'cavalgar', 'escalar', 'equilibrio', 'nadar', 'suportar', 'velocidade'],
  },
  {
    name: 'Mente e Arcano',
    skills: [
      'concentração',
      'controleArcano',
      'controleEmocional',
      'discernir',
      'percepção',
      'prontidão',
    ],
  },
  {
    name: 'Sociais',
    skills: ['atuação', 'blefar', 'dissuadir', 'diplomacia', 'dissimulação', 'empatia', 'persuadir'],
  },
  {
    name: 'Conhecimentos',
    skills: [
      'conhecimentoArcano',
      'conhecimentoPolitico',
      'conhecimentoHistorico',
      'conhecimentoReligioso',
      'conhecimentoNatureza',
      'conhecimentoMilitar',
    ],
  },
  {
    name: 'Ofícios e Ermos',
    skills: ['avaliar', 'cura', 'furtar', 'furtividade', 'oficios', 'sobrevivência', 'salvar'],
  },
]

// ============================================
// PONTOS E LINHAS
// ============================================

export interface SkillRowModel {
  key: SkillKey
  label: string
  distributed: number
  bonus: number
  total: number
  inUse: boolean
  detail: string
  // Teto de pontos distribuídos (total do atributo relacionado) e sigla desse atributo
  max: number
  attributeAbbr: string
  // Distribuídos acima do teto (o atributo caiu depois): só marca, nunca recorta o gravado
  isOverCap: boolean
}

/**
 * Disponíveis, gastos e restantes da aba de perícias.
 * Pool: (nível + 1) * 10; só as chaves de SKILLS entram na conta.
 */
export function getSkillPointSummary(
  skills: StoredSkills | null | undefined,
  level: number | null | undefined,
): { available: number; used: number; remaining: number } {
  const stored = skills || {}
  const available = calculateTotalSkillPoints(level || 0)
  const skillValues = Object.fromEntries(
    SKILLS.map((key) => [key, toSkillValue(stored[key])]),
  )
  return {
    available,
    used: calculateUsedSkillPoints(skillValues),
    remaining: calculateRemainingSkillPoints(skillValues, available),
  }
}

export function buildSkillRow(
  skills: StoredSkills | null | undefined,
  key: SkillKey,
  level: number | null | undefined,
  attributes?: StoredAttributes | null,
): SkillRowModel {
  // Sem atributos, todos valem 0. Os valores gravados nunca são recortados pelo teto
  const value = toSkillValue((skills || {})[key])
  const inUse = value.distributed !== 0 || value.bonus !== 0
  const max = getSkillDistributionCap(key, attributes, level || 0)
  return {
    key,
    label: SKILL_LABELS[key],
    distributed: value.distributed,
    bonus: value.bonus,
    total: calculateSkillTotal(value, level || 0),
    inUse,
    detail: inUse ? `${value.distributed} + ${value.bonus}` : '',
    max,
    attributeAbbr: ATTRIBUTE_ABBREVIATIONS[SKILL_ATTRIBUTES[key]],
    isOverCap: value.distributed > max,
  }
}

export function countSkillsInUse(skills: StoredSkills | null | undefined): number {
  return SKILLS.filter((key) => {
    const value = toSkillValue((skills || {})[key])
    return value.distributed !== 0 || value.bonus !== 0
  }).length
}

/**
 * Grupos de linhas para a lista. Em "uso" a linha aberta continua visível,
 * para não sumir quando é zerada durante a edição.
 */
export function buildSkillGroups(
  skills: StoredSkills | null | undefined,
  level: number | null | undefined,
  filter: SkillFilter,
  openSkill: SkillKey | null,
  attributes?: StoredAttributes | null,
): Array<{ name: string; rows: SkillRowModel[] }> {
  return SKILL_GROUPS.map((group) => ({
    name: group.name,
    rows: group.skills
      .map((key) => buildSkillRow(skills, key, level, attributes))
      .filter((row) => filter === 'todas' || row.inUse || row.key === openSkill),
  })).filter((group) => group.rows.length > 0)
}

export function formatSkillTotalCaption(level: number | null | undefined): string {
  return `Total = 1 + distribuídos + bônus + ${getSkillLevelBonus(level || 0)} de nível`
}

// ============================================
// GRAVAÇÕES DE PERÍCIA
// ============================================

/**
 * Payload do passo +/- de uma perícia. Mesma expressão do antigo +1/+2/+3:
 * espalha as perícias e a perícia atual, e nunca desce de 0.
 * O teto (distributedCap) só vale para distribuídos num passo +: sobe até o teto e um
 * valor já acima dele nunca é reduzido aqui. O − e o bônus não têm teto.
 */
export function buildSkillStepUpdate(
  skills: StoredSkills | null | undefined,
  key: SkillKey,
  field: SkillStepField,
  delta: number,
  distributedCap?: number,
): { skills: UpdateCharacterRequest['skills'] } {
  const current = skills || {}
  const skill = current[key] || { distributed: 0, bonus: 0 }
  const base = skill[field] || 0
  let next = base + delta
  if (field === 'distributed' && delta > 0 && distributedCap !== undefined) {
    next = Math.max(base, Math.min(next, distributedCap))
  }
  const merged = {
    ...current,
    [key]: {
      ...skill,
      [field]: Math.max(0, next),
    },
  }
  return { skills: merged as UpdateCharacterRequest['skills'] }
}

// ============================================
// KIT DE AVENTUREIRO
// ============================================

// index é a posição na lista guardada: edições e remoções usam sempre ele
export type KitEntry = { item: AdventureKitItem; index: number }

/**
 * Separa personalizados (isDefault falso ou ausente) e padrão, em ordem de armazenamento.
 */
export function partitionAdventureKit(kit: unknown): { custom: KitEntry[]; standard: KitEntry[] } {
  const custom: KitEntry[] = []
  const standard: KitEntry[] = []
  if (!Array.isArray(kit)) return { custom, standard }

  kit.forEach((raw, index) => {
    if (!raw || typeof raw !== 'object') return
    const item = raw as AdventureKitItem
    if (item.isDefault) standard.push({ item, index })
    else custom.push({ item, index })
  })
  return { custom, standard }
}

export function buildAddKitItemUpdate(kit: AdventureKitItem[] | null | undefined) {
  const newItem = { name: '', quantity: 1, isDefault: false }
  return { adventureKit: [...(kit || []), newItem] }
}

export function buildRemoveKitItemUpdate(kit: AdventureKitItem[], index: number) {
  return { adventureKit: kit.filter((_, i) => i !== index) }
}

export function buildResetKitUpdate() {
  return { adventureKit: DEFAULT_ADVENTURE_KIT }
}
