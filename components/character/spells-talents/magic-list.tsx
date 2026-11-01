// components/character/spells-talents/magic-list.tsx
// Peças visuais compartilhadas por Magias e Talentos (DS-06): barra de busca e filtros,
// card de nível, linha recolhível, ações da linha e selos. Só apresentação: nenhuma gravação aqui.

import { useId, type ReactNode } from 'react'
import { Check, ChevronDown, ChevronUp, Pencil, Search, Sparkles, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SectionTitle, type SectionMarkerTone } from '@/components/ui/section-card'
import { cn } from '@/lib/utils'
import type { LevelFilter } from '@/lib/spells-talents'

// ============================================
// BARRA: BUSCA, AÇÕES E CHIPS DE NÍVEL
// ============================================

interface MagicListToolbarProps {
  query: string
  onQueryChange: (value: string) => void
  placeholder: string
  actions?: ReactNode
  levels: readonly number[]
  activeLevel: LevelFilter
  onLevelChange: (level: LevelFilter) => void
  countLabel?: string
}

const CHIP_BASE =
  'h-11 shrink-0 whitespace-nowrap rounded-full border px-3.5 font-numeric text-[15px] font-semibold tabular-nums'

function LevelChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        CHIP_BASE,
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-border bg-transparent text-foreground'
      )}
    >
      {label}
    </button>
  )
}

// Ocupa todas as colunas do fluxo da aba (column-span), como no design
export function MagicListToolbar({
  query,
  onQueryChange,
  placeholder,
  actions,
  levels,
  activeLevel,
  onLevelChange,
  countLabel,
}: MagicListToolbarProps) {
  return (
    <div className="mb-3 flex max-w-[720px] flex-col gap-2.5 [column-span:all]">
      <div className="flex gap-2">
        <label className="flex h-[46px] min-w-0 flex-1 items-center gap-2.5 rounded-(--radius) border border-input bg-card px-3 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30">
          <Search aria-hidden="true" className="size-[18px] shrink-0 text-muted-foreground" />
          <input
            type="search"
            aria-label={placeholder}
            placeholder={placeholder}
            value={query}
            onChange={event => onQueryChange(event.target.value)}
            className="min-w-0 flex-1 border-0 bg-transparent text-base outline-none"
          />
        </label>
        {actions}
      </div>
      {levels.length > 0 && (
        <div className="-mx-3 flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none]">
          <LevelChip label="Todos" active={activeLevel === 'todos'} onClick={() => onLevelChange('todos')} />
          {levels.map(level => (
            <LevelChip
              key={level}
              label={`Nv ${level}`}
              active={activeLevel === level}
              onClick={() => onLevelChange(level)}
            />
          ))}
        </div>
      )}
      {countLabel && <span className="text-[13px] text-muted-foreground">{countLabel}</span>}
    </div>
  )
}

// ============================================
// CARD DE NÍVEL E LINHA RECOLHÍVEL
// ============================================

// Sem padding: as linhas vão de borda a borda (por isso não usa SectionCard)
export function MagicLevelGroup({
  level,
  tone,
  countLabel,
  children,
}: {
  level: number
  tone: SectionMarkerTone
  countLabel: string
  children: ReactNode
}) {
  return (
    <section className="mb-3 flex break-inside-avoid flex-col rounded-(--radius) border bg-card text-card-foreground shadow-card">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
        <SectionTitle tone={tone}>{`Nível ${level}`}</SectionTitle>
        <span className="text-[13px] text-muted-foreground">{countLabel}</span>
      </div>
      {children}
    </section>
  )
}

interface MagicEntryRowProps {
  name: string
  sub?: string
  isOpen: boolean
  onToggle: () => void
  badges?: ReactNode
  // Controle fora do botão de expandir (ex.: "usado hoje"); nada interativo fica dentro do botão
  leading?: ReactNode
  muted?: boolean
  children?: ReactNode
}

export function MagicEntryRow({
  name,
  sub,
  isOpen,
  onToggle,
  badges,
  leading,
  muted,
  children,
}: MagicEntryRowProps) {
  const bodyId = useId()
  const Chevron = isOpen ? ChevronUp : ChevronDown
  return (
    <div className={cn('border-t border-border', isOpen && 'bg-muted')}>
      <div className="flex items-stretch">
        {leading}
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={bodyId}
          onClick={onToggle}
          className={cn(
            'grid min-h-[60px] flex-1 grid-cols-[minmax(0,1fr)_auto_20px] items-center gap-3 py-2 pr-4 text-left',
            leading ? 'pl-1' : 'pl-4'
          )}
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <span
              className={cn(
                'truncate text-base font-semibold',
                muted && 'text-muted-foreground line-through'
              )}
            >
              {name}
            </span>
            {sub && <span className="truncate text-[13px] text-muted-foreground">{sub}</span>}
          </span>
          <span className="flex flex-col items-end gap-0.5">{badges}</span>
          <Chevron aria-hidden="true" className="size-[18px] text-muted-foreground" />
        </button>
      </div>
      {isOpen && (
        <div id={bodyId} className="flex flex-col gap-3 px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  )
}

// ============================================
// AÇÕES DA LINHA, SELOS E ESTADO VAZIO
// ============================================

interface MagicEntryActionsProps {
  mode: 'view' | 'edit'
  onEdit?: () => void
  onDone?: () => void
  onDelete: () => void
  deleteDisabled?: boolean
}

export function MagicEntryActions({
  mode,
  onEdit,
  onDone,
  onDelete,
  deleteDisabled,
}: MagicEntryActionsProps) {
  return (
    <div className="flex gap-2">
      {mode === 'view' && onEdit && (
        <Button type="button" variant="outline" onClick={onEdit} className="h-11 gap-1.5 bg-card px-3.5">
          <Pencil aria-hidden="true" className="size-4" />
          Editar
        </Button>
      )}
      {mode === 'edit' && (
        <Button type="button" variant="outline" onClick={onDone} className="h-11 gap-1.5 px-3.5">
          <Check aria-hidden="true" className="size-4" />
          Concluir
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={onDelete}
        disabled={deleteDisabled}
        className="h-11 gap-1.5 bg-transparent px-3.5 text-destructive hover:text-destructive"
      >
        <Trash2 aria-hidden="true" className="size-4" />
        Excluir
      </Button>
    </div>
  )
}

export function MagicCostBadge({ cost }: { cost: number }) {
  return (
    <span className="inline-flex items-center gap-1 font-numeric text-lg font-semibold tabular-nums text-berkana">
      <span className="sr-only">Custo de Berkana: </span>
      <Sparkles aria-hidden="true" className="size-3.5" />
      {cost}
    </span>
  )
}

export function MagicOncePerDayBadge() {
  return (
    <span className="whitespace-nowrap rounded-(--radius) border border-primary px-[7px] py-px text-xs font-semibold text-primary">
      1× ao dia
    </span>
  )
}

export function MagicEmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="px-3 py-8 text-center text-[15px] text-muted-foreground [column-span:all]">
      <p>{title}</p>
      {hint && <p className="mt-1 text-[13px]">{hint}</p>}
    </div>
  )
}
