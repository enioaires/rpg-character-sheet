// lib/spells-talents.ts
// Helpers puros da aba Magias e Talentos (DS-06): filtro, agrupamento por nível e rótulos.
// Sem React, sem componentes e sem API: o `bun test` carrega este módulo diretamente.

// ============================================
// TIPOS
// ============================================

export type MagicView = 'magias' | 'talentos'
export type LevelFilter = 'todos' | number

// Entrada da lista com o índice ORIGINAL no array guardado (todas as gravações usam este índice)
export interface MagicEntry<T> {
  item: T
  index: number
  level: number
}

export interface MagicLevelGroupData<T> {
  level: number
  entries: MagicEntry<T>[]
}

// ============================================
// NÍVEL
// ============================================

// Nível ausente, nulo ou inválido conta como 0
export function toEntryLevel(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
  return Number.isFinite(n) ? n : 0
}

function levelOf(item: unknown): number {
  return toEntryLevel((item as { level?: unknown } | null | undefined)?.level)
}

// Níveis presentes, únicos e em ordem crescente
export function listLevels(items: readonly unknown[]): number[] {
  return [...new Set(items.map(levelOf))].sort((a, b) => a - b)
}

// Se o nível escolhido deixou de existir (edição ou exclusão), volta para "Todos"
export function resolveLevelFilter(level: LevelFilter, levels: readonly number[]): LevelFilter {
  return level !== 'todos' && levels.includes(level) ? level : 'todos'
}

// ============================================
// BUSCA
// ============================================

// Minúsculas, sem acento (NFD sem marcas U+0300-U+036F) e sem espaços nas pontas
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

// Campos que não são texto são ignorados; busca em branco combina com tudo
export function matchesQuery(fields: readonly unknown[], query: string): boolean {
  const q = normalizeSearchText(query)
  if (!q) return true
  return fields.some(
    field => typeof field === 'string' && normalizeSearchText(field).includes(q)
  )
}

// ============================================
// AGRUPAMENTO
// ============================================

interface GroupOptions<T> {
  level: LevelFilter
  query: string
  searchFields: (item: T) => readonly unknown[]
}

// Só para exibição: a ordem guardada dentro de cada grupo e o índice original ficam intactos
export function groupEntriesByLevel<T>(
  items: readonly T[],
  { level, query, searchFields }: GroupOptions<T>
): MagicLevelGroupData<T>[] {
  const byLevel = new Map<number, MagicEntry<T>[]>()
  items.forEach((item, index) => {
    const entryLevel = levelOf(item)
    if (level !== 'todos' && entryLevel !== level) return
    if (!matchesQuery(searchFields(item), query)) return
    const list = byLevel.get(entryLevel) ?? []
    list.push({ item, index, level: entryLevel })
    byLevel.set(entryLevel, list)
  })
  return [...byLevel.entries()]
    .sort(([a], [b]) => a - b)
    .map(([groupLevel, entries]) => ({ level: groupLevel, entries }))
}

export function countGroupedEntries<T>(groups: readonly MagicLevelGroupData<T>[]): number {
  return groups.reduce((total, group) => total + group.entries.length, 0)
}

// ============================================
// RÓTULOS
// ============================================

export function magicCountNoun(view: MagicView, count: number): string {
  const singular = view === 'magias' ? 'magia' : 'talento'
  return `${count} ${count === 1 ? singular : `${singular}s`}`
}

export function magicResultLabel(view: MagicView, shown: number, total: number): string {
  if (shown === total) return `${magicCountNoun(view, total)}, por nível · toque para ver detalhes`
  return `${shown} de ${total}`
}

// Primeira linha não vazia de um texto (linha de apoio do talento)
export function firstLine(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.split('\n').find(line => line.trim() !== '')?.trim() ?? ''
}

// Total de dano/duração sem valor útil ("" ou "0")
export function isBlankScaledTotal(total: string): boolean {
  const t = total.trim()
  return t === '' || t === '0'
}

// Linha de apoio da magia: tipo · Dano <total> · alcance (dano omitido quando em branco)
export function spellSubLine(
  spell: { type?: unknown; range?: unknown },
  damageTotal: string
): string {
  const type = typeof spell.type === 'string' ? spell.type.trim() : ''
  const range = typeof spell.range === 'string' ? spell.range.trim() : ''
  return [type, isBlankScaledTotal(damageTotal) ? '' : `Dano ${damageTotal.trim()}`, range]
    .filter(Boolean)
    .join(' · ')
}

// ============================================
// ÍNDICES ABERTOS APÓS EXCLUIR
// ============================================

// Remove o índice excluído e desloca os posteriores, para a linha aberta seguir a mesma entrada
export function removeIndexFromSet(set: ReadonlySet<number>, removed: number): Set<number> {
  const next = new Set<number>()
  set.forEach(i => {
    if (i < removed) next.add(i)
    else if (i > removed) next.add(i - 1)
  })
  return next
}
