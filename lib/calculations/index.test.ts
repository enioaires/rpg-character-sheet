// Testes unitários de lib/calculations (CALC-02)
//
// Os valores esperados são os números produzidos pelo app no commit 832fa9b
// (ver o plano da tarefa rápida 261101-iig). Nunca edite um valor para
// acompanhar uma fórmula alterada: um teste falhando significa que o CALC-01
// mudou um número derivado.

import { describe, expect, it } from 'bun:test'
import * as calculations from '@/lib/calculations'
import {
  calculateAllAttributes,
  calculateAllSkills,
  calculateAttributeBase,
  calculateAttributeTotal,
  calculateAvailableSkillPoints,
  calculateLevelUpSkillPoints,
  calculateMaxBerkana,
  calculateRemainingSkillPoints,
  calculateSkillTotal,
  calculateTotalSkillPoints,
  calculateUsedSkillPoints,
  calculateVitalityLevels,
  canLevelUp,
  getAttributeLevelBonus,
  getBaseBerkana,
  getDefaultSkills,
  getSkillLevelBonus,
  getSkillPointsPerLevel,
  getTotalXPForLevel,
  getXPRequiredForNextLevel,
  initializeSkills,
  processLevelUp,
  toAttributeValue,
  toSkillValue,
  toVitalityBase,
  validateSkillDistribution,
  type AttributeValue,
  type SkillValue,
  type VitalityBase
} from '@/lib/calculations'

// ============================================
// FIXTURES LITERAIS
// ============================================

const DEFAULT_SKILL_NAMES = [
  'acrobacia',
  'atuacao',
  'avaliar',
  'ataqueSurpresa',
  'blefar',
  'concentracao',
  'controleArcano',
  'controleEmocional',
  'combateDesarmado',
  'conhecimentoArcano',
  'conhecimentoPolitico',
  'conhecimentoHistorico',
  'conhecimentoReligioso',
  'conhecimentoNatureza',
  'conhecimentoMilitar',
  'cura',
  'cavalgar',
  'duelo',
  'dissuadir',
  'diplomacia',
  'discernir',
  'dissimulacao',
  'empatia',
  'escalar',
  'equilibrio',
  'furtar',
  'furtividade',
  'nadar',
  'oficios',
  'percepcao',
  'prontidao',
  'persuadir',
  'sobrevivencia',
  'suportar',
  'salvar',
  'velocidade'
]

// Duas perícias com 5 pontos distribuídos (o bônus não conta como gasto)
const U5 = {
  acrobacia: { distributed: 3, bonus: 0 },
  nadar: { distributed: 2, bonus: 5 }
}

// Duas perícias com 25 pontos distribuídos
const U25 = {
  acrobacia: { distributed: 20, bonus: 0 },
  nadar: { distributed: 5, bonus: 3 }
}

// ============================================
// ATRIBUTOS
// ============================================

describe('getAttributeLevelBonus', () => {
  it('nível 0 e 4 não têm bônus', () => {
    expect(getAttributeLevelBonus(0)).toBe(0)
    expect(getAttributeLevelBonus(4)).toBe(0)
  })

  it('nível 5 e 9 têm +1', () => {
    expect(getAttributeLevelBonus(5)).toBe(1)
    expect(getAttributeLevelBonus(9)).toBe(1)
  })

  it('nível 10 tem +2 e nível 99 tem +19', () => {
    expect(getAttributeLevelBonus(10)).toBe(2)
    expect(getAttributeLevelBonus(99)).toBe(19)
  })
})

describe('calculateAttributeBase', () => {
  it('soma raça, classe e bônus sem bônus de nível', () => {
    expect(calculateAttributeBase({ race: 10, class: 12, bonus: 2 })).toBe(24)
  })

  it('tudo zerado resulta em 0', () => {
    expect(calculateAttributeBase({ race: 0, class: 0, bonus: 0 })).toBe(0)
  })

  it('aceita valor negativo', () => {
    expect(calculateAttributeBase({ race: -1, class: 0, bonus: 2 })).toBe(1)
  })
})

describe('calculateAttributeTotal', () => {
  const attribute = { race: 10, class: 12, bonus: 2 }

  it('nível 0 não aplica bônus de nível', () => {
    expect(calculateAttributeTotal(attribute, 0)).toBe(24)
  })

  it('nível 1 ainda não tem bônus', () => {
    expect(calculateAttributeTotal(attribute, 1)).toBe(24)
  })

  it('nível 4 ainda não tem bônus e nível 5 soma +1', () => {
    expect(calculateAttributeTotal(attribute, 4)).toBe(24)
    expect(calculateAttributeTotal(attribute, 5)).toBe(25)
  })

  it('nível 9 mantém +1 e nível 10 soma +2', () => {
    expect(calculateAttributeTotal(attribute, 9)).toBe(25)
    expect(calculateAttributeTotal(attribute, 10)).toBe(26)
  })

  it('nível 14 mantém +2 e nível 15 soma +3', () => {
    expect(calculateAttributeTotal(attribute, 14)).toBe(26)
    expect(calculateAttributeTotal(attribute, 15)).toBe(27)
  })

  it('nível 99 soma +19', () => {
    expect(calculateAttributeTotal(attribute, 99)).toBe(43)
  })
})

describe('calculateAllAttributes', () => {
  it('calcula o total de cada atributo no nível 5', () => {
    const attributes = {
      forca: { race: 10, class: 12, bonus: 2 },
      agilidade: { race: 5, class: 5, bonus: 0 }
    }
    expect(calculateAllAttributes(attributes, 5)).toEqual({ forca: 25, agilidade: 11 })
  })

  it('objeto vazio resulta em objeto vazio', () => {
    expect(calculateAllAttributes({}, 5)).toEqual({})
  })
})

// ============================================
// VITALIDADE
// ============================================

describe('calculateVitalityLevels', () => {
  const vitality = { race: 200, class: 250 }

  it('nível 0 calcula os seis estágios', () => {
    expect(calculateVitalityLevels(vitality, 0)).toEqual({
      notavel: 450,
      ferido: 430,
      gravementeFerido: 410,
      condenado: 390,
      incapacitado: 370,
      coma: 350
    })
  })

  it('nível 4 calcula os seis estágios', () => {
    expect(calculateVitalityLevels(vitality, 4)).toEqual({
      notavel: 2250,
      ferido: 2150,
      gravementeFerido: 2050,
      condenado: 1950,
      incapacitado: 1850,
      coma: 1750
    })
  })

  it('nível 5 calcula os seis estágios', () => {
    expect(calculateVitalityLevels(vitality, 5)).toEqual({
      notavel: 2700,
      ferido: 2580,
      gravementeFerido: 2460,
      condenado: 2340,
      incapacitado: 2220,
      coma: 2100
    })
  })

  it('nível 9 calcula os seis estágios', () => {
    expect(calculateVitalityLevels(vitality, 9)).toEqual({
      notavel: 4500,
      ferido: 4300,
      gravementeFerido: 4100,
      condenado: 3900,
      incapacitado: 3700,
      coma: 3500
    })
  })

  it('nível 10 calcula os seis estágios', () => {
    expect(calculateVitalityLevels(vitality, 10)).toEqual({
      notavel: 4950,
      ferido: 4730,
      gravementeFerido: 4510,
      condenado: 4290,
      incapacitado: 4070,
      coma: 3850
    })
  })

  it('não limita estágios negativos (valor fixado como está)', () => {
    expect(calculateVitalityLevels({ race: 30, class: 20 }, 0)).toEqual({
      notavel: 50,
      ferido: 30,
      gravementeFerido: 10,
      condenado: -10,
      incapacitado: -30,
      coma: -50
    })
  })
})

// ============================================
// BERKANA
// ============================================

describe('getBaseBerkana', () => {
  it('a base de Berkana é 100', () => {
    expect(getBaseBerkana()).toBe(100)
  })
})

describe('calculateMaxBerkana', () => {
  it('nível 0 devolve apenas a base', () => {
    expect(calculateMaxBerkana(0, 100, 0)).toBe(100)
  })

  it('nível 4 soma 40 e nível 5 soma 50', () => {
    expect(calculateMaxBerkana(4, 100, 0)).toBe(140)
    expect(calculateMaxBerkana(5, 100, 0)).toBe(150)
  })

  it('soma o bônus de Berkana', () => {
    expect(calculateMaxBerkana(5, 100, 7)).toBe(157)
  })

  it('nível 9 soma 90 e nível 10 soma 100', () => {
    expect(calculateMaxBerkana(9, 100, 0)).toBe(190)
    expect(calculateMaxBerkana(10, 100, 0)).toBe(200)
  })

  it('usa base e bônus informados', () => {
    expect(calculateMaxBerkana(10, 120, 5)).toBe(225)
  })
})

// ============================================
// PERÍCIAS
// ============================================

describe('getSkillLevelBonus', () => {
  it('nível 0 e 4 não têm bônus', () => {
    expect(getSkillLevelBonus(0)).toBe(0)
    expect(getSkillLevelBonus(4)).toBe(0)
  })

  it('nível 5 e 9 têm +1', () => {
    expect(getSkillLevelBonus(5)).toBe(1)
    expect(getSkillLevelBonus(9)).toBe(1)
  })

  it('nível 10 tem +2 e nível 99 tem +19', () => {
    expect(getSkillLevelBonus(10)).toBe(2)
    expect(getSkillLevelBonus(99)).toBe(19)
  })
})

describe('calculateSkillTotal', () => {
  const skill = { distributed: 3, bonus: 1 }

  it('nível 0 e 4 não têm bônus de nível', () => {
    expect(calculateSkillTotal(skill, 0)).toBe(5)
    expect(calculateSkillTotal(skill, 4)).toBe(5)
  })

  it('nível 5 e 9 somam +1', () => {
    expect(calculateSkillTotal(skill, 5)).toBe(6)
    expect(calculateSkillTotal(skill, 9)).toBe(6)
  })

  it('nível 10 soma +2', () => {
    expect(calculateSkillTotal(skill, 10)).toBe(7)
  })
})

describe('calculateAllSkills', () => {
  it('calcula o total de cada perícia no nível 10', () => {
    const skills = {
      acrobacia: { distributed: 3, bonus: 1 },
      nadar: { distributed: 0, bonus: 0 }
    }
    expect(calculateAllSkills(skills, 10)).toEqual({ acrobacia: 7, nadar: 3 })
  })
})

describe('getSkillPointsPerLevel', () => {
  it('são 10 pontos por nível', () => {
    expect(getSkillPointsPerLevel()).toBe(10)
  })
})

describe('calculateUsedSkillPoints', () => {
  it('soma os pontos distribuídos e ignora o bônus', () => {
    expect(calculateUsedSkillPoints(U5)).toBe(5)
  })

  it('sem perícias, nenhum ponto usado', () => {
    expect(calculateUsedSkillPoints({})).toBe(0)
  })
})

describe('calculateTotalSkillPoints', () => {
  it('é (nível + 1) × 10, contando o nível 0', () => {
    expect(calculateTotalSkillPoints(0)).toBe(10)
    expect(calculateTotalSkillPoints(1)).toBe(20)
    expect(calculateTotalSkillPoints(4)).toBe(50)
    expect(calculateTotalSkillPoints(5)).toBe(60)
    expect(calculateTotalSkillPoints(9)).toBe(100)
    expect(calculateTotalSkillPoints(10)).toBe(110)
  })
})

describe('calculateLevelUpSkillPoints', () => {
  it('é nível × 10, sem contar o nível 0', () => {
    expect(calculateLevelUpSkillPoints(0)).toBe(0)
    expect(calculateLevelUpSkillPoints(1)).toBe(10)
    expect(calculateLevelUpSkillPoints(4)).toBe(40)
    expect(calculateLevelUpSkillPoints(5)).toBe(50)
    expect(calculateLevelUpSkillPoints(9)).toBe(90)
    expect(calculateLevelUpSkillPoints(10)).toBe(100)
  })
})

describe('calculateRemainingSkillPoints', () => {
  it('desconta os pontos usados do total informado', () => {
    expect(calculateRemainingSkillPoints(U5, 10)).toBe(5)
    expect(calculateRemainingSkillPoints(U5, 20)).toBe(15)
  })

  it('não limita em zero: total 0 com 5 usados resulta em -5', () => {
    expect(calculateRemainingSkillPoints(U5, 0)).toBe(-5)
  })

  it('pode ficar negativo quando o gasto excede o total', () => {
    expect(calculateRemainingSkillPoints(U25, 10)).toBe(-15)
  })

  it('sem perícias, restam todos os pontos', () => {
    expect(calculateRemainingSkillPoints({}, 10)).toBe(10)
  })
})

describe('calculateAvailableSkillPoints', () => {
  it('nível 0 limita em 0 (não devolve -5)', () => {
    expect(calculateAvailableSkillPoints(U5, 0)).toBe(0)
  })

  it('nível 1 tem 10 pontos, restando 5', () => {
    expect(calculateAvailableSkillPoints(U5, 1)).toBe(5)
  })

  it('nível 2 tem 20 pontos, restando 15', () => {
    expect(calculateAvailableSkillPoints(U5, 2)).toBe(15)
  })
})

describe('validateSkillDistribution', () => {
  it('distribuição zerada no nível 0 é válida', () => {
    const skills = {
      acrobacia: { distributed: 0, bonus: 0 },
      nadar: { distributed: 0, bonus: 0 }
    }
    expect(validateSkillDistribution(skills, 0)).toEqual({ isValid: true, errors: [] })
  })

  it('nível 0 com 1 ponto distribuído gera dois erros, nesta ordem', () => {
    expect(validateSkillDistribution({ acrobacia: { distributed: 1, bonus: 0 } }, 0)).toEqual({
      isValid: false,
      errors: [
        'Total de pontos usado (1) excede o disponível (0)',
        'acrobacia: 1 pontos excedem o máximo de 0'
      ]
    })
  })

  it('3 pontos no nível 1 está exatamente no limite', () => {
    expect(validateSkillDistribution({ acrobacia: { distributed: 3, bonus: 0 } }, 1)).toEqual({
      isValid: true,
      errors: []
    })
  })

  it('4 pontos no nível 1 excede o máximo por perícia', () => {
    expect(validateSkillDistribution({ acrobacia: { distributed: 4, bonus: 0 } }, 1)).toEqual({
      isValid: false,
      errors: ['acrobacia: 4 pontos excedem o máximo de 3']
    })
  })

  it('pontos negativos são inválidos', () => {
    expect(validateSkillDistribution({ acrobacia: { distributed: -1, bonus: 0 } }, 1)).toEqual({
      isValid: false,
      errors: ['acrobacia: pontos distribuídos não podem ser negativos']
    })
  })

  it('total acima do disponível no nível 2 gera erro de total', () => {
    const skills = {
      a: { distributed: 6, bonus: 0 },
      b: { distributed: 6, bonus: 0 },
      c: { distributed: 6, bonus: 0 },
      d: { distributed: 3, bonus: 0 }
    }
    expect(validateSkillDistribution(skills, 2)).toEqual({
      isValid: false,
      errors: ['Total de pontos usado (21) excede o disponível (20)']
    })
  })
})

describe('getDefaultSkills', () => {
  it('lista as 36 perícias padrão, sem repetição e nesta ordem', () => {
    const names = getDefaultSkills()
    expect(names).toEqual(DEFAULT_SKILL_NAMES)
    expect(names.length).toBe(36)
    expect(new Set(names).size).toBe(36)
  })
})

describe('initializeSkills', () => {
  it('cria as 36 perícias na ordem padrão, todas zeradas', () => {
    const skills = initializeSkills()
    expect(Object.keys(skills)).toEqual(DEFAULT_SKILL_NAMES)
    expect(Object.keys(skills).length).toBe(36)
    for (const name of DEFAULT_SKILL_NAMES) {
      expect(skills[name]).toEqual({ distributed: 0, bonus: 0 })
    }
  })
})

// ============================================
// XP E LEVEL UP
// ============================================

describe('getXPRequiredForNextLevel', () => {
  it('é 10 × (nível + 1)', () => {
    expect(getXPRequiredForNextLevel(0)).toBe(10)
    expect(getXPRequiredForNextLevel(1)).toBe(20)
    expect(getXPRequiredForNextLevel(4)).toBe(50)
    expect(getXPRequiredForNextLevel(98)).toBe(990)
  })
})

describe('getTotalXPForLevel', () => {
  it('acumula o XP necessário até o nível', () => {
    expect(getTotalXPForLevel(0)).toBe(0)
    expect(getTotalXPForLevel(1)).toBe(10)
    expect(getTotalXPForLevel(2)).toBe(30)
    expect(getTotalXPForLevel(3)).toBe(60)
    expect(getTotalXPForLevel(5)).toBe(150)
  })
})

describe('canLevelUp', () => {
  it('XP exato do nível 0 permite subir', () => {
    expect(canLevelUp(10, 0)).toBe(true)
  })

  it('um XP a menos não permite subir', () => {
    expect(canLevelUp(9, 0)).toBe(false)
  })

  it('XP exato do nível 98 permite subir', () => {
    expect(canLevelUp(990, 98)).toBe(true)
  })

  it('nível 99 é o máximo e não sobe', () => {
    expect(canLevelUp(10000, 99)).toBe(false)
  })
})

describe('processLevelUp', () => {
  it('sobe do nível 0 para o 1 recalculando os derivados', () => {
    const result = processLevelUp({
      level: 0,
      currentXP: 15,
      vitality: { race: 200, class: 250 },
      maxBerkana: 999,
      berkanaBonus: 5
    })
    expect(result).toEqual({
      level: 1,
      currentXP: 5,
      maxBerkana: 115,
      vitalityLevels: {
        notavel: 900,
        ferido: 860,
        gravementeFerido: 820,
        condenado: 780,
        incapacitado: 740,
        coma: 700
      },
      xpUsedForLevelUp: 10,
      newSkillPointsAvailable: 10
    })
  })

  it('lança erro quando o XP é insuficiente', () => {
    expect(() =>
      processLevelUp({
        level: 0,
        currentXP: 9,
        vitality: { race: 200, class: 250 },
        maxBerkana: 100,
        berkanaBonus: 0
      })
    ).toThrow('XP insuficiente para subir de nível')
  })

  it('lança erro no nível máximo mesmo com muito XP', () => {
    expect(() =>
      processLevelUp({
        level: 99,
        currentXP: 100000,
        vitality: { race: 200, class: 250 },
        maxBerkana: 100,
        berkanaBonus: 0
      })
    ).toThrow('XP insuficiente para subir de nível')
  })
})

// ============================================
// NORMALIZAÇÃO DE ENTRADAS
// ============================================

// Os valores vêm da especificação da 261101-iif (PD-03, regra `|| 0`),
// não de uma função do commit 832fa9b.
describe('toAttributeValue', () => {
  it('mantém valores numéricos, inclusive negativos', () => {
    expect(toAttributeValue({ race: 2, class: 1, bonus: 4 })).toEqual({ race: 2, class: 1, bonus: 4 })
    expect(toAttributeValue({ race: -1, class: 0, bonus: 2 })).toEqual({ race: -1, class: 0, bonus: 2 })
  })

  it('undefined, null e objeto vazio viram zeros', () => {
    const zeros = { race: 0, class: 0, bonus: 0 }
    expect(toAttributeValue(undefined)).toEqual(zeros)
    expect(toAttributeValue(null)).toEqual(zeros)
    expect(toAttributeValue({})).toEqual(zeros)
  })

  it('campo nulo vira 0', () => {
    const raw = { race: null, class: 5 } as unknown as Partial<AttributeValue>
    expect(toAttributeValue(raw)).toEqual({ race: 0, class: 5, bonus: 0 })
  })

  it('campo NaN vira 0', () => {
    expect(toAttributeValue({ race: NaN, class: 3, bonus: 1 })).toEqual({ race: 0, class: 3, bonus: 1 })
  })
})

// Os valores vêm da especificação da 261101-iif (PD-03, regra `|| 0`),
// não de uma função do commit 832fa9b.
describe('toSkillValue', () => {
  it('mantém valores numéricos', () => {
    expect(toSkillValue({ distributed: 2, bonus: 1 })).toEqual({ distributed: 2, bonus: 1 })
  })

  it('undefined, null e objeto vazio viram zeros', () => {
    const zeros = { distributed: 0, bonus: 0 }
    expect(toSkillValue(undefined)).toEqual(zeros)
    expect(toSkillValue(null)).toEqual(zeros)
    expect(toSkillValue({})).toEqual(zeros)
  })

  it('campo ausente vira 0', () => {
    expect(toSkillValue({ distributed: 3 })).toEqual({ distributed: 3, bonus: 0 })
  })

  it('campo nulo vira 0', () => {
    const raw = { distributed: null, bonus: 4 } as unknown as Partial<SkillValue>
    expect(toSkillValue(raw)).toEqual({ distributed: 0, bonus: 4 })
  })

  it('campo NaN vira 0', () => {
    expect(toSkillValue({ distributed: NaN, bonus: 2 })).toEqual({ distributed: 0, bonus: 2 })
  })
})

// Os valores vêm da especificação da 261101-iif (PD-03, regra `|| 0`),
// não de uma função do commit 832fa9b.
describe('toVitalityBase', () => {
  it('mantém valores numéricos', () => {
    expect(toVitalityBase({ race: 20, class: 30 })).toEqual({ race: 20, class: 30 })
  })

  it('undefined, null e objeto vazio viram zeros', () => {
    const zeros = { race: 0, class: 0 }
    expect(toVitalityBase(undefined)).toEqual(zeros)
    expect(toVitalityBase(null)).toEqual(zeros)
    expect(toVitalityBase({})).toEqual(zeros)
  })

  it('campo ausente vira 0', () => {
    expect(toVitalityBase({ race: 60 })).toEqual({ race: 60, class: 0 })
  })

  it('campo nulo vira 0', () => {
    const raw = { race: null, class: 45 } as unknown as Partial<VitalityBase>
    expect(toVitalityBase(raw)).toEqual({ race: 0, class: 45 })
  })

  it('campo NaN vira 0', () => {
    expect(toVitalityBase({ race: NaN, class: 10 })).toEqual({ race: 0, class: 10 })
  })
})

// ============================================
// COBERTURA DOS EXPORTS
// ============================================

// Ao adicionar um export em lib/calculations sem teste, este guard falha:
// inclua o nome em TESTED_FUNCTIONS junto com um describe com o mesmo nome.
const TESTED_FUNCTIONS = [
  'calculateAllAttributes',
  'calculateAllSkills',
  'calculateAttributeBase',
  'calculateAttributeTotal',
  'calculateAvailableSkillPoints',
  'calculateLevelUpSkillPoints',
  'calculateMaxBerkana',
  'calculateRemainingSkillPoints',
  'calculateSkillTotal',
  'calculateTotalSkillPoints',
  'calculateUsedSkillPoints',
  'calculateVitalityLevels',
  'canLevelUp',
  'getAttributeLevelBonus',
  'getBaseBerkana',
  'getDefaultSkills',
  'getSkillLevelBonus',
  'getSkillPointsPerLevel',
  'getTotalXPForLevel',
  'getXPRequiredForNextLevel',
  'initializeSkills',
  'processLevelUp',
  'toAttributeValue',
  'toSkillValue',
  'toVitalityBase',
  'validateSkillDistribution'
]

describe('exports de lib/calculations', () => {
  it('toda função exportada tem teste (e vice-versa)', () => {
    const exported = Object.entries(calculations)
      .filter(([, value]) => typeof value === 'function')
      .map(([name]) => name)
      .sort()
    expect(exported).toEqual([...TESTED_FUNCTIONS].sort())
    expect(TESTED_FUNCTIONS.length).toBe(26)
  })
})
