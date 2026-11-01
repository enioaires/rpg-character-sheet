// Testes unitários de lib/spells-talents (DS-06)
//
// Cobrem filtro, agrupamento por nível (com o índice ORIGINAL de cada entrada),
// busca sem acento, rótulos de contagem e o ajuste dos índices abertos após excluir.

import { describe, expect, it } from 'bun:test'
import {
  countGroupedEntries,
  firstLine,
  groupEntriesByLevel,
  isBlankScaledTotal,
  listLevels,
  magicCountNoun,
  magicResultLabel,
  matchesQuery,
  normalizeSearchText,
  removeIndexFromSet,
  resolveLevelFilter,
  spellSubLine,
  toEntryLevel,
} from '@/lib/spells-talents'

// ============================================
// NÍVEL DA ENTRADA
// ============================================

describe('toEntryLevel', () => {
  it('lê números e converte texto numérico', () => {
    expect(toEntryLevel(3)).toBe(3)
    expect(toEntryLevel('4')).toBe(4)
    expect(toEntryLevel(2.5)).toBe(2.5)
  })

  it('cai para 0 quando falta ou é inválido', () => {
    expect(toEntryLevel(undefined)).toBe(0)
    expect(toEntryLevel(null)).toBe(0)
    expect(toEntryLevel('abc')).toBe(0)
    expect(toEntryLevel(NaN)).toBe(0)
  })
})

describe('listLevels', () => {
  it('lista níveis únicos em ordem crescente; ausente e null contam como 0', () => {
    expect(listLevels([{ level: 2 }, { level: 0 }, {}, { level: 2 }, { level: 5 }, null])).toEqual([
      0, 2, 5,
    ])
  })

  it('devolve lista vazia sem entradas', () => {
    expect(listLevels([])).toEqual([])
  })
})

describe('resolveLevelFilter', () => {
  it('volta para todos quando o nível escolhido sumiu', () => {
    expect(resolveLevelFilter(3, [0, 2])).toBe('todos')
    expect(resolveLevelFilter('todos', [])).toBe('todos')
  })

  it('mantém o nível quando ainda existe', () => {
    expect(resolveLevelFilter(2, [0, 2])).toBe(2)
  })
})

// ============================================
// BUSCA
// ============================================

describe('normalizeSearchText', () => {
  it('ignora caixa, acento e espaços nas pontas', () => {
    expect(normalizeSearchText('  Alteração  ')).toBe('alteracao')
  })
})

describe('matchesQuery', () => {
  it('ignora acento e caixa', () => {
    expect(matchesQuery(['Alteração de Combate'], 'alteracao')).toBe(true)
  })

  it('ignora campos que não são texto', () => {
    expect(matchesQuery(['Fogo', undefined, 3], 'fogo')).toBe(true)
  })

  it('busca em branco combina com tudo', () => {
    expect(matchesQuery(['Fogo'], '   ')).toBe(true)
  })

  it('não combina quando o termo não aparece', () => {
    expect(matchesQuery(['Fogo'], 'gelo')).toBe(false)
  })
})

// ============================================
// AGRUPAMENTO
// ============================================

interface Item {
  name?: string
  level?: unknown
  type?: string
}

const fields = (item: Item | null) => [item?.name, item?.type]

describe('groupEntriesByLevel', () => {
  const items: (Item | null)[] = [
    { name: 'Alfa', level: 2 },
    { name: 'Beta', level: 0 },
    { name: 'Gama', level: 1 },
    { name: 'Delta', level: 1 },
    { name: 'Sem nível' },
    null,
  ]

  it('ordena grupos por nível e mantém a ordem guardada dentro do grupo', () => {
    const groups = groupEntriesByLevel(items, { level: 'todos', query: '', searchFields: fields })
    expect(groups.map(g => g.level)).toEqual([0, 1, 2])
    expect(groups[1].entries.map(e => e.item?.name)).toEqual(['Gama', 'Delta'])
  })

  it('carrega o índice ORIGINAL de cada entrada', () => {
    const groups = groupEntriesByLevel(items, { level: 'todos', query: '', searchFields: fields })
    const group1 = groups.find(g => g.level === 1)
    expect(group1?.entries.map(e => e.index)).toEqual([2, 3])
    const group0 = groups.find(g => g.level === 0)
    expect(group0?.entries.map(e => e.index)).toEqual([1, 4, 5])
  })

  it('agrupa nível ausente sob 0 sem lançar com null', () => {
    const groups = groupEntriesByLevel(items, { level: 'todos', query: '', searchFields: fields })
    expect(groups[0].entries.some(e => e.item === null)).toBe(true)
  })

  it('filtro numérico mantém só aquele nível', () => {
    const groups = groupEntriesByLevel(items, { level: 1, query: '', searchFields: fields })
    expect(groups.map(g => g.level)).toEqual([1])
    expect(countGroupedEntries(groups)).toBe(2)
  })

  it('busca usa searchFields e combina com o nível', () => {
    const groups = groupEntriesByLevel(items, { level: 'todos', query: 'del', searchFields: fields })
    expect(groups).toHaveLength(1)
    expect(groups[0].entries[0].index).toBe(3)
    const none = groupEntriesByLevel(items, { level: 2, query: 'del', searchFields: fields })
    expect(none).toEqual([])
  })

  it('entrada vazia devolve lista vazia e grupos sem entradas são omitidos', () => {
    expect(groupEntriesByLevel([], { level: 'todos', query: '', searchFields: fields })).toEqual([])
    const groups = groupEntriesByLevel(items, { level: 'todos', query: 'zzz', searchFields: fields })
    expect(groups).toEqual([])
  })
})

describe('countGroupedEntries', () => {
  it('soma as entradas de todos os grupos', () => {
    expect(
      countGroupedEntries([
        { level: 0, entries: [{ item: 1, index: 0, level: 0 }] },
        {
          level: 1,
          entries: [
            { item: 2, index: 1, level: 1 },
            { item: 3, index: 2, level: 1 },
          ],
        },
      ])
    ).toBe(3)
    expect(countGroupedEntries([])).toBe(0)
  })
})

// ============================================
// RÓTULOS
// ============================================

describe('magicCountNoun', () => {
  it('concorda singular e plural', () => {
    expect(magicCountNoun('magias', 1)).toBe('1 magia')
    expect(magicCountNoun('magias', 2)).toBe('2 magias')
    expect(magicCountNoun('talentos', 1)).toBe('1 talento')
    expect(magicCountNoun('talentos', 0)).toBe('0 talentos')
  })
})

describe('magicResultLabel', () => {
  it('sem filtro mostra a dica de toque', () => {
    expect(magicResultLabel('magias', 4, 4)).toBe('4 magias, por nível · toque para ver detalhes')
    expect(magicResultLabel('talentos', 1, 1)).toBe(
      '1 talento, por nível · toque para ver detalhes'
    )
  })

  it('com filtro mostra "N de M"', () => {
    expect(magicResultLabel('magias', 2, 4)).toBe('2 de 4')
  })
})

describe('firstLine', () => {
  it('devolve a primeira linha não vazia', () => {
    expect(firstLine('\n  Combate +4\nDuelo +4')).toBe('Combate +4')
  })

  it('devolve vazio para valores que não são texto', () => {
    expect(firstLine(undefined)).toBe('')
    expect(firstLine(42)).toBe('')
  })
})

describe('isBlankScaledTotal', () => {
  it('considera vazio, espaços e 0 como em branco', () => {
    expect(isBlankScaledTotal('')).toBe(true)
    expect(isBlankScaledTotal('  ')).toBe(true)
    expect(isBlankScaledTotal('0')).toBe(true)
  })

  it('não considera valores reais como em branco', () => {
    expect(isBlankScaledTotal('4000')).toBe(false)
    expect(isBlankScaledTotal('1d6')).toBe(false)
  })
})

describe('spellSubLine', () => {
  it('junta tipo, dano e alcance', () => {
    expect(spellSubLine({ type: 'Alteração de Combate', range: '4 Metros' }, '5000')).toBe(
      'Alteração de Combate · Dano 5000 · 4 Metros'
    )
  })

  it('omite dano em branco e tipo vazio', () => {
    expect(spellSubLine({ type: '', range: 'Pessoal' }, '0')).toBe('Pessoal')
    expect(spellSubLine({}, '')).toBe('')
  })

  it('ignora tipo e alcance que não são texto', () => {
    expect(spellSubLine({ type: 3, range: null }, '10')).toBe('Dano 10')
  })
})

// ============================================
// ÍNDICES ABERTOS APÓS EXCLUIR
// ============================================

describe('removeIndexFromSet', () => {
  it('descarta o índice removido e desloca os posteriores', () => {
    expect(removeIndexFromSet(new Set([0, 2, 3]), 2)).toEqual(new Set([0, 2]))
    expect(removeIndexFromSet(new Set([0, 1]), 0)).toEqual(new Set([0]))
  })

  it('mantém índices anteriores intactos', () => {
    expect(removeIndexFromSet(new Set([1]), 5)).toEqual(new Set([1]))
  })

  it('não altera o conjunto de entrada', () => {
    const input = new Set([0, 2, 3])
    removeIndexFromSet(input, 2)
    expect(input).toEqual(new Set([0, 2, 3]))
  })
})
