// Testes do modelo de apresentação da aba Perícias e Kit (DS-05): paridade com as
// fórmulas e os payloads da aba anterior, cobertura dos grupos de perícias e ordem do kit.

import { describe, expect, it } from 'bun:test'
import {
  calculateRemainingSkillPoints,
  calculateSkillTotal,
  calculateTotalSkillPoints,
  calculateUsedSkillPoints,
  toSkillValue,
} from '@/lib/calculations'
import { DEFAULT_ADVENTURE_KIT, SKILLS } from '@/lib/constants/character'
import { getDefaultCharacterData } from '@/lib/defaults/character'
import {
  SKILL_GROUPS,
  buildAddKitItemUpdate,
  buildRemoveKitItemUpdate,
  buildResetKitUpdate,
  buildSkillGroups,
  buildSkillRow,
  buildSkillStepUpdate,
  countSkillsInUse,
  formatSkillTotalCaption,
  getSkillPointSummary,
  partitionAdventureKit,
  type SkillKey,
} from './skills-kit-model'

// ============================================
// PARIDADE COM A ABA ANTERIOR (e274082)
// ============================================

type LooseSkills = Record<string, { distributed?: number; bonus?: number; [key: string]: unknown } | null | undefined>

// Cópia literal do resumo de pontos da aba anterior (card "Distribuição de Pontos de Perícia")
function legacySummary(skills: LooseSkills | null | undefined, level: number | null | undefined) {
  const safeSkills = skills || {}
  const skillValues = Object.fromEntries(
    SKILLS.map((skillKey) => [skillKey, toSkillValue(safeSkills[skillKey])]),
  )
  const availablePoints = calculateTotalSkillPoints(level || 0)
  const usedPoints = calculateUsedSkillPoints(skillValues)
  const remainingPoints = calculateRemainingSkillPoints(skillValues, availablePoints)
  return { available: availablePoints, used: usedPoints, remaining: remainingPoints }
}

// Cópia literal do total de cada linha da aba anterior (card "Perícias - Resumo")
function legacyTotal(skills: LooseSkills, skillKey: string, level: number | null | undefined) {
  const skill = skills[skillKey] || { distributed: 0, bonus: 0 }
  return calculateSkillTotal(toSkillValue(skill), level || 0)
}

// Cópia literal do +1/+2/+3 da aba anterior (handleQuickAdd)
function legacyQuickAdd(skills: LooseSkills, skillKey: string, amount: number) {
  const skill = skills[skillKey] || { distributed: 0, bonus: 0 }
  const newValue = (skill.distributed || 0) + amount
  return {
    skills: {
      ...skills,
      [skillKey]: {
        ...skill,
        distributed: Math.max(0, newValue),
      },
    },
  }
}

const mixedSkills: LooseSkills = {
  percepção: { distributed: 17, bonus: 0 },
  percepcao: { distributed: 3, bonus: 2 },
  duelo: { distributed: 13, bonus: 7, extra: 'x' },
  salvar: null,
  sobrevivência: { bonus: 5 },
  atuacao: { distributed: 5 },
  ataqueSurpresa: { distributed: 4 },
}

const fixtures: Array<[string, LooseSkills]> = [
  ['vazio', {}],
  ['defaults', getDefaultCharacterData().skills as LooseSkills],
  ['misto', mixedSkills],
]
const levels = [undefined, null, 0, 1, 4, 5, 9, 10, 23]

describe('SKILL_GROUPS', () => {
  const flat = SKILL_GROUPS.flatMap((group) => [...group.skills])

  it('cobre cada chave de SKILLS exatamente uma vez', () => {
    expect(flat).toHaveLength(36)
    expect(new Set(flat).size).toBe(36)
    expect([...flat].sort()).toEqual([...SKILLS].sort())
  })

  it('mantém os nomes e a ordem dos grupos', () => {
    expect(SKILL_GROUPS.map((group) => group.name)).toEqual([
      'Combate',
      'Físicas',
      'Mente e Arcano',
      'Sociais',
      'Conhecimentos',
      'Ofícios e Ermos',
    ])
  })

  it('mantém a ordem de SKILLS dentro de cada grupo', () => {
    for (const group of SKILL_GROUPS) {
      const indexes = group.skills.map((key) => (SKILLS as readonly string[]).indexOf(key))
      for (let i = 1; i < indexes.length; i++) {
        expect(indexes[i]).toBeGreaterThan(indexes[i - 1])
      }
    }
  })
})

describe('getSkillPointSummary', () => {
  it('é igual ao resumo da aba anterior para todos os níveis e fixtures', () => {
    for (const [, skills] of fixtures) {
      for (const level of levels) {
        expect(getSkillPointSummary(skills, level)).toEqual(legacySummary(skills, level))
      }
    }
    expect(getSkillPointSummary(null, 3)).toEqual(legacySummary(null, 3))
    expect(getSkillPointSummary(undefined, 3)).toEqual(legacySummary(undefined, 3))
  })

  it('nível 7 com o fixture misto dá 80 / 30 / 50 (chaves fora de SKILLS não contam)', () => {
    expect(getSkillPointSummary(mixedSkills, 7)).toEqual({ available: 80, used: 30, remaining: 50 })
  })

  it('nível 0 sem perícias dá 10 / 0 / 10 e restante negativo quando gasta demais', () => {
    expect(getSkillPointSummary({}, 0)).toEqual({ available: 10, used: 0, remaining: 10 })
    expect(getSkillPointSummary({ duelo: { distributed: 25 } }, 0).remaining).toBe(-15)
  })
})

describe('buildSkillRow', () => {
  it('o total é igual ao da aba anterior para toda chave, nível e fixture', () => {
    for (const [, skills] of fixtures) {
      for (const level of levels) {
        for (const key of SKILLS) {
          expect(buildSkillRow(skills, key, level).total).toBe(legacyTotal(skills, key, level))
        }
      }
    }
  })

  it('valores literais do fixture misto no nível 7', () => {
    const percepcao = buildSkillRow(mixedSkills, 'percepção', 7)
    expect(percepcao).toMatchObject({ total: 19, detail: '17 + 0', inUse: true, label: 'Percepção' })
    const duelo = buildSkillRow(mixedSkills, 'duelo', 7)
    expect(duelo).toMatchObject({ total: 22, detail: '13 + 7', inUse: true })
    // Descompasso de chaves conhecido (ataqueSupresa x ataqueSurpresa): preservado
    const ataque = buildSkillRow(mixedSkills, 'ataqueSupresa', 7)
    expect(ataque).toMatchObject({ total: 2, detail: '', inUse: false })
  })

  it('nível 10 com acrobacia zerada dá total 3', () => {
    expect(buildSkillRow({}, 'acrobacia', 10).total).toBe(3)
  })
})

describe('countSkillsInUse', () => {
  it('conta só chaves de SKILLS com pontos ou bônus', () => {
    expect(countSkillsInUse(mixedSkills)).toBe(3)
    expect(countSkillsInUse(getDefaultCharacterData().skills as LooseSkills)).toBe(0)
    expect(countSkillsInUse(null)).toBe(0)
  })
})

describe('buildSkillGroups', () => {
  it("'todas' devolve 6 grupos e 36 linhas", () => {
    const groups = buildSkillGroups(mixedSkills, 7, 'todas', null)
    expect(groups).toHaveLength(6)
    expect(groups.reduce((sum, group) => sum + group.rows.length, 0)).toBe(36)
  })

  it("'uso' devolve só os grupos com perícias em uso", () => {
    const groups = buildSkillGroups(mixedSkills, 7, 'uso', null)
    expect(groups.map((group) => group.name)).toEqual(['Combate', 'Mente e Arcano', 'Ofícios e Ermos'])
  })

  it("'uso' mantém a linha aberta mesmo zerada", () => {
    const groups = buildSkillGroups(mixedSkills, 7, 'uso', 'acrobacia')
    const fisicas = groups.find((group) => group.name === 'Físicas')
    expect(fisicas?.rows.map((row) => row.key)).toEqual(['acrobacia'])
  })
})

describe('buildSkillStepUpdate', () => {
  const stepSkills: LooseSkills = { ...mixedSkills }

  it('distribuídos é igual ao +1/+2/+3 da aba anterior, também com -1', () => {
    for (const key of ['duelo', 'cura', 'salvar', 'atuacao']) {
      for (const delta of [1, 2, 3, -1]) {
        const before = structuredClone(stepSkills)
        expect(buildSkillStepUpdate(stepSkills, key as SkillKey, 'distributed', delta)).toEqual(
          legacyQuickAdd(stepSkills, key, delta) as unknown as ReturnType<typeof buildSkillStepUpdate>,
        )
        expect(stepSkills).toEqual(before)
      }
    }
  })

  it('preserva chaves fora de SKILLS e campos extras', () => {
    const update = buildSkillStepUpdate(stepSkills, 'duelo', 'distributed', 1)
    const next = update.skills as Record<string, unknown>
    expect(next.atuacao).toEqual({ distributed: 5 })
    expect(next.percepcao).toEqual({ distributed: 3, bonus: 2 })
    expect(next.duelo).toEqual({ distributed: 14, bonus: 7, extra: 'x' })
  })

  it('bônus sobe e desce com piso 0 e preserva distribuídos e extras', () => {
    const up = buildSkillStepUpdate(stepSkills, 'duelo', 'bonus', 1).skills as Record<string, unknown>
    expect(up.duelo).toEqual({ distributed: 13, bonus: 8, extra: 'x' })
    const floor = buildSkillStepUpdate({ duelo: { distributed: 1, bonus: 0 } }, 'duelo', 'bonus', -1)
    expect((floor.skills as Record<string, { bonus: number }>).duelo.bonus).toBe(0)
    const missing = buildSkillStepUpdate({}, 'cura', 'bonus', 1).skills as Record<string, unknown>
    expect(missing.cura).toEqual({ distributed: 0, bonus: 1 })
  })
})

describe('formatSkillTotalCaption', () => {
  it('mostra o bônus de nível real', () => {
    expect(formatSkillTotalCaption(7)).toBe('Total = 1 + distribuídos + bônus + 1 de nível')
    expect(formatSkillTotalCaption(4).endsWith('+ 0 de nível')).toBe(true)
    expect(formatSkillTotalCaption(10).endsWith('+ 2 de nível')).toBe(true)
    expect(formatSkillTotalCaption(null).endsWith('+ 0 de nível')).toBe(true)
  })
})

describe('kit de aventureiro', () => {
  const kit = [
    { name: 'a', quantity: 1, isDefault: true },
    { name: 'b', quantity: 2, isDefault: false },
    { name: 'c', quantity: 1, isDefault: true },
    { name: 'd', quantity: 3 },
  ]

  it('separa personalizados e padrão mantendo o índice de armazenamento', () => {
    const { custom, standard } = partitionAdventureKit(kit)
    expect(custom.map((entry) => entry.index)).toEqual([1, 3])
    expect(standard.map((entry) => entry.index)).toEqual([0, 2])
    expect(custom[0].item.name).toBe('b')
  })

  it('kit que não é lista dá duas listas vazias e ignora entradas que não são objeto', () => {
    expect(partitionAdventureKit(undefined)).toEqual({ custom: [], standard: [] })
    expect(partitionAdventureKit({})).toEqual({ custom: [], standard: [] })
    const mixed = partitionAdventureKit([null, 'x', { name: 'ok', isDefault: true }])
    expect(mixed.standard.map((entry) => entry.index)).toEqual([2])
    expect(mixed.custom).toEqual([])
  })

  it('adicionar item é igual à expressão da aba anterior', () => {
    const newItem = { name: '', quantity: 1, isDefault: false }
    expect(buildAddKitItemUpdate(kit)).toEqual({ adventureKit: [...(kit || []), newItem] })
    expect(buildAddKitItemUpdate(undefined)).toEqual({ adventureKit: [newItem] })
  })

  it('remover item é igual ao filter da aba anterior e não altera a entrada', () => {
    const before = structuredClone(kit)
    expect(buildRemoveKitItemUpdate(kit, 3)).toEqual({
      adventureKit: kit.filter((_, i) => i !== 3),
    })
    expect(kit).toEqual(before)
  })

  it('restaurar grava o kit padrão', () => {
    expect(buildResetKitUpdate()).toEqual({ adventureKit: DEFAULT_ADVENTURE_KIT })
  })
})
