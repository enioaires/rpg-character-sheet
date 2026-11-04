// components/character/quick-actions-bar.tsx
import { useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Lock,
  LockOpen,
  Sword,
  Target,
  UserRound,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { BERKANA_STATE_DISPLAY, formatGameNumber } from '@/components/character/resource-display'
import {
  calculateMaxVitality,
  getBerkanaState,
  resolveBerkanaPool,
  resolveCurrentVitality,
  toVitalityBase,
} from '@/lib/calculations'
import { cn } from '@/lib/utils'
import type { CharacterData } from '@/components/character/types'
import type { QuickSheetKind } from '@/components/character/quick-sheets/quick-sheet-context'

interface QuickActionsBarProps {
  character: CharacterData
  isEditMode: boolean
  onToggleEditMode?: () => void
  onOpenSheet: (kind: QuickSheetKind) => void
}

const MAIN_BUTTON_CLASS =
  'flex h-14 items-center gap-2.5 rounded-(--radius) border bg-background px-3 text-left outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/50'

const ACTION_BUTTON_CLASS =
  'flex h-12 flex-col items-center justify-center gap-0.5 rounded-(--radius) text-xs font-semibold text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50'

export function QuickActionsBar({ character, isEditMode, onToggleEditMode, onOpenSheet }: QuickActionsBarProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Valores vêm todos dos helpers de lib/calculations (mesma fonte dos cards e das sheets)
  const max = calculateMaxVitality(toVitalityBase(character.vitality), character.level || 0)
  const current = resolveCurrentVitality(character.currentVitality, max)
  const isConfigured = max > 0
  const vitalityColorClass = isConfigured ? 'text-vitality-notavel' : 'text-muted-foreground'

  const pool = resolveBerkanaPool(character)
  const berkanaDisplay = BERKANA_STATE_DISPLAY[getBerkanaState(pool.current, pool.max)]

  if (!isVisible) {
    return (
      <div className="fixed right-4 bottom-4 z-20">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsVisible(true)}
          aria-label="Mostrar ações rápidas"
          className="size-11 bg-card shadow-lg"
        >
          <ChevronUp className="size-5" aria-hidden="true" />
        </Button>
      </div>
    )
  }

  const vitalityLabel = `Vitalidade ${formatGameNumber(current)} de ${formatGameNumber(max)}`

  return (
    <div className="sticky bottom-0 z-20 border-t bg-card shadow-[0_-8px_24px_-12px_oklch(0_0_0/0.5)]">
      <div className="mx-auto flex max-w-[720px] flex-col gap-1.5 px-2.5 pt-2 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-[1.25fr_1fr_auto] gap-1.5">
          <button
            type="button"
            onClick={() => onOpenSheet('vit')}
            aria-label={vitalityLabel}
            className={MAIN_BUTTON_CLASS}
          >
            <Heart className={cn('size-[22px]', vitalityColorClass)} aria-hidden="true" />
            <span className="flex min-w-0 flex-col leading-[1.1]">
              <span className="font-numeric text-2xl font-semibold tabular-nums">
                {formatGameNumber(current)}
                <span className="text-[15px] font-medium text-muted-foreground">/{formatGameNumber(max)}</span>
              </span>
              <span className={cn('text-xs font-semibold whitespace-nowrap', vitalityColorClass)}>Vitalidade</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenSheet('berk')}
            aria-label={`Berkana ${formatGameNumber(pool.current)} de ${formatGameNumber(pool.max)}, ${berkanaDisplay.label}`}
            className={MAIN_BUTTON_CLASS}
          >
            <berkanaDisplay.Icon className="size-[22px] text-berkana" aria-hidden="true" />
            <span className="flex min-w-0 flex-col leading-[1.1]">
              <span className="font-numeric text-2xl font-semibold tabular-nums">
                {formatGameNumber(pool.current)}
                <span className="text-[15px] font-medium text-muted-foreground">/{formatGameNumber(pool.max)}</span>
              </span>
              <span className="text-xs font-semibold text-berkana">Berkana</span>
            </span>
          </button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible(false)}
            aria-label="Ocultar ações rápidas"
            className="size-11 self-center text-muted-foreground"
          >
            <ChevronDown className="size-5" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          <button type="button" onClick={() => onOpenSheet('arma')} className={ACTION_BUTTON_CLASS}>
            <Sword className="size-5 text-foreground" aria-hidden="true" />
            Armas
          </button>
          <button type="button" onClick={() => onOpenSheet('pericias')} className={ACTION_BUTTON_CLASS}>
            <Target className="size-5 text-foreground" aria-hidden="true" />
            Perícias
          </button>
          <button type="button" onClick={() => onOpenSheet('atributos')} className={ACTION_BUTTON_CLASS}>
            <UserRound className="size-5 text-foreground" aria-hidden="true" />
            Atributos
          </button>
          <button
            type="button"
            aria-pressed={!isEditMode}
            onClick={() => onToggleEditMode?.()}
            className={cn(
              ACTION_BUTTON_CLASS,
              'border',
              isEditMode
                ? 'border-primary bg-accent text-accent-foreground hover:bg-accent'
                : 'border-border bg-transparent text-muted-foreground'
            )}
          >
            {isEditMode ? (
              <LockOpen className="size-5" aria-hidden="true" />
            ) : (
              <Lock className="size-5" aria-hidden="true" />
            )}
            {isEditMode ? 'Desbloqueado' : 'Bloqueado'}
          </button>
        </div>
      </div>
    </div>
  )
}
