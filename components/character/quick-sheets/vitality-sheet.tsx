'use client'

import { useState } from 'react'
import { Heart, HeartPulse, Lock, LoaderCircle, Swords } from 'lucide-react'
import { toast } from 'sonner'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { Button } from '@/components/ui/button'
import { NumericDisplay } from '@/components/ui/numeric-display'
import { AmountEntry } from '@/components/character/quick-sheets/amount-entry'
import { VITALITY_STAGE_DISPLAY, formatGameNumber } from '@/components/character/resource-display'
import { isCharacterConflictError } from '@/lib/api/character-concurrency'
import {
  applyVitalityDamage,
  applyVitalityHeal,
  calculateVitalityLevels,
  calculateVitalityTotal,
  getCurrentVitalityStage,
  resolveCurrentVitalityLevels,
  toVitalityBase,
  type VitalityLevels,
} from '@/lib/calculations'
import { VITALITY_LEVELS } from '@/lib/constants/character'
import { cn } from '@/lib/utils'
import type { CharacterData, UpdateCharacterMutation } from '@/components/character/types'

const VITALITY_CHIPS = [100, 500, 1000, 5000] as const

type VitalityAction = 'damage' | 'heal' | 'restore'

interface VitalitySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  character: CharacterData
  characterId: string
  isEditMode: boolean
  updateCharacterMutation: UpdateCharacterMutation
}

export function VitalitySheet({
  open,
  onOpenChange,
  character,
  characterId,
  isEditMode,
  updateCharacterMutation,
}: VitalitySheetProps) {
  const [amount, setAmount] = useState('')
  const [pendingAction, setPendingAction] = useState<VitalityAction | null>(null)

  const { level, vitality, currentVitality } = character
  const maxLevels = calculateVitalityLevels(toVitalityBase(vitality), level || 0)
  const current = resolveCurrentVitalityLevels(currentVitality, maxLevels)
  const currentTotal = calculateVitalityTotal(current)
  const maxTotal = calculateVitalityTotal(maxLevels)
  const stage = getCurrentVitalityStage(current, maxLevels)
  const stageDisplay = stage ? VITALITY_STAGE_DISPLAY[stage] : null

  const amountValue = parseInt(amount, 10) || 0
  const isBusy = updateCharacterMutation.isPending || pendingAction !== null
  const isConfigured = stage !== null
  const hasNothingToHeal = VITALITY_LEVELS.every((key) => current[key] >= maxLevels[key])

  const handleOpenChange = (next: boolean) => {
    if (!next) setAmount('')
    onOpenChange(next)
  }

  // Todas as gravações passam pelo mesmo mutateAsync (fila serial + expectedUpdatedAt)
  const write = async (
    action: VitalityAction,
    nextVitality: VitalityLevels,
    messages: { success: string; error: string; log: string },
    closeAfter: boolean
  ) => {
    setPendingAction(action)
    try {
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: { currentVitality: nextVitality },
      })
      toast.success(messages.success)
      setAmount('')
      if (closeAfter) onOpenChange(false)
    } catch (error) {
      // Conflito: o hook já mostra o toast de conflito e recarrega a ficha
      if (isCharacterConflictError(error)) return
      console.error(messages.log, error)
      toast.error(messages.error)
    } finally {
      setPendingAction(null)
    }
  }

  const handleDamage = () =>
    write(
      'damage',
      applyVitalityDamage(currentVitality, maxLevels, amountValue),
      {
        success: `${formatGameNumber(amountValue)} de dano aplicado!`,
        error: 'Erro ao aplicar dano',
        log: 'Erro ao aplicar dano:',
      },
      true
    )

  const handleHeal = () =>
    write(
      'heal',
      applyVitalityHeal(currentVitality, maxLevels, amountValue),
      {
        success: `${formatGameNumber(amountValue)} de vitalidade curada!`,
        error: 'Erro ao curar vitalidade',
        log: 'Erro ao curar vitalidade:',
      },
      true
    )

  // Mesmo payload do antigo "Vida Máxima"
  const handleRestore = () =>
    write(
      'restore',
      maxLevels,
      {
        success: 'Vitalidade restaurada ao máximo!',
        error: 'Erro ao restaurar vitalidade',
        log: 'Erro ao restaurar vitalidade:',
      },
      false
    )

  const stageLabelAfter = (levels: VitalityLevels) => {
    const next = getCurrentVitalityStage(resolveCurrentVitalityLevels(levels, maxLevels), maxLevels)
    return next ? VITALITY_STAGE_DISPLAY[next].label : 'Vitalidade'
  }

  const previewText = (() => {
    if (amountValue <= 0) return 'Digite o valor ou use os atalhos.'
    const afterDamage = resolveCurrentVitalityLevels(
      applyVitalityDamage(currentVitality, maxLevels, amountValue),
      maxLevels
    )
    const afterHeal = resolveCurrentVitalityLevels(
      applyVitalityHeal(currentVitality, maxLevels, amountValue),
      maxLevels
    )
    return `Dano → ${formatGameNumber(calculateVitalityTotal(afterDamage))} (${stageLabelAfter(afterDamage)}) · Cura → ${formatGameNumber(calculateVitalityTotal(afterHeal))} (${stageLabelAfter(afterHeal)})`
  })()

  const actionDisabled = !isEditMode || amountValue <= 0 || isBusy || !isConfigured

  return (
    <BottomSheet open={open} onOpenChange={handleOpenChange} title="Vitalidade">
      <div className="flex items-center justify-between gap-2">
        <NumericDisplay
          size="lg"
          value={formatGameNumber(currentTotal)}
          max={formatGameNumber(maxTotal)}
        />
        {stageDisplay && stage ? (
          <span
            className={cn('inline-flex items-center gap-1.5 text-sm font-semibold', stageDisplay.textClassName)}
          >
            <stageDisplay.Icon className="size-4" aria-hidden="true" />
            {stageDisplay.label}
            <span className="font-normal text-muted-foreground">
              {VITALITY_LEVELS.indexOf(stage) + 1}/6
            </span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Heart className="size-4" aria-hidden="true" />
            Sem vitalidade definida
          </span>
        )}
      </div>

      <AmountEntry
        amount={amount}
        onAmountChange={setAmount}
        ariaLabel="Valor do dano"
        chips={VITALITY_CHIPS}
        disabled={!isEditMode || isBusy}
      />

      {isConfigured ? (
        <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
          {previewText}
        </p>
      ) : (
        <p className="min-h-5 text-sm text-muted-foreground" aria-live="polite">
          Vitalidade não configurada · defina Raça e Classe em Básicos → Vitalidade.
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="destructive"
          onClick={handleDamage}
          disabled={actionDisabled}
          className="h-14 text-[17px] font-bold"
        >
          {pendingAction === 'damage' ? (
            <LoaderCircle className="size-5 animate-ficha-spin" aria-hidden="true" />
          ) : (
            <Swords className="size-5" aria-hidden="true" />
          )}
          Dano
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleHeal}
          disabled={actionDisabled || hasNothingToHeal}
          className="h-14 border text-[17px] font-bold"
        >
          {pendingAction === 'heal' ? (
            <LoaderCircle className="size-5 animate-ficha-spin" aria-hidden="true" />
          ) : (
            <HeartPulse className="size-5" aria-hidden="true" />
          )}
          Cura
        </Button>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleRestore}
        disabled={!isEditMode || isBusy}
        className="h-12 w-full border-primary font-semibold text-primary"
      >
        {pendingAction === 'restore' ? (
          <LoaderCircle className="size-5 animate-ficha-spin" aria-hidden="true" />
        ) : (
          <Heart className="size-5" aria-hidden="true" />
        )}
        Restaurar vitalidade máxima
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
