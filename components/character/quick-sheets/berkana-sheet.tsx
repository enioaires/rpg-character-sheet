'use client'

import { useState } from 'react'
import { Lock, LoaderCircle, RotateCcw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { NumericDisplay } from '@/components/ui/numeric-display'
import { AmountEntry } from '@/components/character/quick-sheets/amount-entry'
import { BERKANA_STATE_DISPLAY, formatGameNumber } from '@/components/character/resource-display'
import { isCharacterConflictError } from '@/lib/api/character-concurrency'
import { getBerkanaState, recoverBerkana, resolveBerkanaPool, spendBerkana } from '@/lib/calculations'
import type { CharacterData, UpdateCharacterMutation } from '@/components/character/types'

const BERKANA_CHIPS = [10, 30, 50, 100] as const

type BerkanaAction = 'spend' | 'recover' | 'restore'

interface BerkanaSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  character: CharacterData
  characterId: string
  isEditMode: boolean
  updateCharacterMutation: UpdateCharacterMutation
}

export function BerkanaSheet({
  open,
  onOpenChange,
  character,
  characterId,
  isEditMode,
  updateCharacterMutation,
}: BerkanaSheetProps) {
  const [amount, setAmount] = useState('')
  const [pendingAction, setPendingAction] = useState<BerkanaAction | null>(null)

  const pool = resolveBerkanaPool(character)
  const state = BERKANA_STATE_DISPLAY[getBerkanaState(pool.current, pool.max)]
  const amountValue = parseInt(amount, 10) || 0
  const isBusy = updateCharacterMutation.isPending || pendingAction !== null
  const actionDisabled = !isEditMode || amountValue <= 0 || isBusy

  const handleOpenChange = (next: boolean) => {
    if (!next) setAmount('')
    onOpenChange(next)
  }

  const write = async (action: BerkanaAction, nextBerkana: number, successMessage: string, closeAfter: boolean) => {
    setPendingAction(action)
    try {
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: { currentBerkana: nextBerkana },
      })
      toast.success(successMessage)
      setAmount('')
      if (closeAfter) onOpenChange(false)
    } catch (error) {
      // Conflito: o hook já mostra o toast de conflito e recarrega a ficha
      if (isCharacterConflictError(error)) return
      console.error('Erro ao atualizar Berkana:', error)
      toast.error('Erro ao atualizar Berkana')
    } finally {
      setPendingAction(null)
    }
  }

  const previewText =
    amountValue > 0
      ? `Gastar → ${formatGameNumber(spendBerkana(pool.current, amountValue))} · Recuperar → ${formatGameNumber(recoverBerkana(pool.current, pool.max, amountValue))}`
      : 'Digite o valor ou use os atalhos.'

  return (
    <BottomSheet open={open} onOpenChange={handleOpenChange} title="Berkana">
      <div className="flex items-center justify-between gap-2">
        <NumericDisplay
          size="lg"
          value={formatGameNumber(pool.current)}
          max={formatGameNumber(pool.max)}
        />
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-berkana">
          <state.Icon className="size-4" aria-hidden="true" />
          {state.label}
        </span>
      </div>

      <AmountEntry
        amount={amount}
        onAmountChange={setAmount}
        ariaLabel="Valor de Berkana"
        chips={BERKANA_CHIPS}
        disabled={!isEditMode || isBusy}
      />

      <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {previewText}
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          onClick={() =>
            write('spend', spendBerkana(pool.current, amountValue), `${formatGameNumber(amountValue)} de Berkana gasta`, true)
          }
          disabled={actionDisabled}
          className="h-14 bg-berkana text-[17px] font-bold text-berkana-foreground hover:bg-berkana/90"
        >
          {pendingAction === 'spend' ? (
            <LoaderCircle className="size-5 animate-ficha-spin" aria-hidden="true" />
          ) : (
            <Sparkles className="size-5" aria-hidden="true" />
          )}
          Gastar
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            write(
              'recover',
              recoverBerkana(pool.current, pool.max, amountValue),
              `${formatGameNumber(amountValue)} de Berkana recuperada`,
              true
            )
          }
          disabled={actionDisabled || pool.current >= pool.max}
          className="h-14 border text-[17px] font-bold"
        >
          {pendingAction === 'recover' ? (
            <LoaderCircle className="size-5 animate-ficha-spin" aria-hidden="true" />
          ) : (
            <RotateCcw className="size-5" aria-hidden="true" />
          )}
          Recuperar
        </Button>
      </div>

      {/* Mesmo payload do antigo "Berkana Máxima" */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => write('restore', pool.max, 'Berkana restaurada ao máximo!', false)}
        disabled={!isEditMode || isBusy}
        className="h-11 font-semibold text-primary"
      >
        Restaurar Berkana ao máximo
      </Button>

      {!isEditMode && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Lock className="size-4" aria-hidden="true" />
          Ficha bloqueada · desbloqueie para alterar.
        </p>
      )}
    </BottomSheet>
  )
}
