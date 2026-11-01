import { Check, CloudOff, LoaderCircle } from 'lucide-react'

import { cn } from '@/lib/utils'

// ============================================
// ESTADOS DOS CAMPOS INLINE (design Ferro & Brasa)
// ============================================

export type SaveStatus = 'idle' | 'saved' | 'error'

export type InlineFieldState =
  | 'readonly'
  | 'idle'
  | 'editing'
  | 'saving'
  | 'saved'
  | 'error'

// Tempo que o check de "salvo" fica visível
export const SAVED_FEEDBACK_MS = 1500

// Rótulo de 12px em caixa alta, espaçamento 0.06em
export const INLINE_FIELD_LABEL_CLASS =
  'text-xs uppercase tracking-[0.06em] text-muted-foreground'

/**
 * Resolve o estado visual de um campo inline. Primeira regra que casar vence:
 * salvando > erro > editando > somente leitura > salvo > ocioso.
 */
export function resolveInlineFieldState({
  isEditing,
  canEdit,
  isSaving,
  saveStatus,
}: {
  isEditing: boolean
  canEdit: boolean
  isSaving: boolean
  saveStatus: SaveStatus
}): InlineFieldState {
  if (isSaving) return 'saving'
  if (saveStatus === 'error') return 'error'
  if (isEditing) return 'editing'
  if (!canEdit) return 'readonly'
  if (saveStatus === 'saved') return 'saved'
  return 'idle'
}

const BOX =
  'flex min-h-11 items-center justify-between gap-1.5 px-2.5 text-base md:text-base rounded-(--radius) border shadow-none'

const FRAME_CLASS: Record<InlineFieldState, string> = {
  readonly: 'flex min-h-7 items-center text-base',
  idle: 'flex min-h-11 w-full cursor-text items-center justify-between gap-1.5 rounded-(--radius) border border-dashed border-input bg-transparent px-2.5 text-left text-base outline-none hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30',
  editing: `${BOX} border-ring bg-background ring-[3px] ring-ring/30 focus-visible:ring-ring/30 dark:bg-background`,
  saving: `${BOX} border-input bg-background text-muted-foreground disabled:opacity-100 dark:bg-background`,
  saved: `${BOX} border-success bg-background dark:bg-background`,
  error: `${BOX} border-destructive bg-background ring-destructive/20 dark:bg-background`,
}

export function inlineFieldFrameClassName(state: InlineFieldState): string {
  return FRAME_CLASS[state]
}

export function InlineFieldStatusIcon({
  state,
  className,
}: {
  state: InlineFieldState
  className?: string
}) {
  if (state === 'saving') {
    return (
      <>
        <LoaderCircle
          className={cn('size-4 shrink-0 animate-ficha-spin text-muted-foreground', className)}
          aria-hidden="true"
        />
        <span className="sr-only">Salvando…</span>
      </>
    )
  }
  if (state === 'saved') {
    return (
      <>
        <Check className={cn('size-4 shrink-0 text-success', className)} aria-hidden="true" />
        <span className="sr-only">Salvo</span>
      </>
    )
  }
  if (state === 'error') {
    return (
      <>
        <CloudOff
          className={cn('size-4 shrink-0 text-destructive', className)}
          aria-hidden="true"
        />
        <span className="sr-only">Não salvou</span>
      </>
    )
  }
  return null
}

export function InlineFieldRetry({
  onRetry,
  keepFocus = false,
}: {
  onRetry: () => void
  // Impede o blur do input ao clicar, para não disparar um segundo salvamento
  keepFocus?: boolean
}) {
  return (
    <button
      type="button"
      className="self-start text-left text-[13px] text-destructive underline-offset-2 hover:underline"
      onClick={onRetry}
      onMouseDown={keepFocus ? (e) => e.preventDefault() : undefined}
    >
      Não salvou · tentar de novo
    </button>
  )
}
