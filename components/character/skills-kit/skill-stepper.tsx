// components/character/skills-kit/skill-stepper.tsx
// Stepper de 44px (menos / valor digitável / mais) com os estados inline de salvamento.
import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EditableNumberField, type CurrentCharacterData } from '@/components/ui/editable-field'
import {
  INLINE_FIELD_LABEL_CLASS,
  InlineFieldRetry,
  InlineFieldStatusIcon,
  SAVED_FEEDBACK_MS,
  resolveInlineFieldState,
  type SaveStatus,
} from '@/components/ui/inline-field-state'
import { cn } from '@/lib/utils'

interface SkillStepperProps {
  label: 'Distribuídos' | 'Bônus'
  skillLabel: string
  characterId: string
  character: CurrentCharacterData
  field: string
  value: number
  isEditMode: boolean
  // A mutação compartilhada da aba está pendente
  disabled: boolean
  onStep: (delta: number) => Promise<void>
  min?: number
}

export function SkillStepper({
  label,
  skillLabel,
  characterId,
  character,
  field,
  value,
  isEditMode,
  disabled,
  onStep,
  min,
}: SkillStepperProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [isSaving, setIsSaving] = useState(false)
  const lastDelta = useRef(0)

  // Some o check de "salvo" depois de um instante
  useEffect(() => {
    if (saveStatus !== 'saved') return
    const timer = setTimeout(() => setSaveStatus('idle'), SAVED_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [saveStatus])

  const handleStep = async (delta: number) => {
    lastDelta.current = delta
    setIsSaving(true)
    try {
      await onStep(delta)
      setSaveStatus('saved')
    } catch (error) {
      console.error('Erro ao ajustar perícia:', error)
      setSaveStatus('error')
    } finally {
      setIsSaving(false)
    }
  }

  const state = resolveInlineFieldState({
    isEditing: false,
    canEdit: isEditMode,
    isSaving,
    saveStatus,
  })
  const lowerLabel = label.toLowerCase()

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1">
        <span className={INLINE_FIELD_LABEL_CLASS}>{label}</span>
        <InlineFieldStatusIcon state={state} />
      </div>
      <div
        className={cn(
          'grid items-center gap-1',
          isEditMode ? 'grid-cols-[44px_minmax(0,1fr)_44px]' : 'grid-cols-1',
        )}
      >
        {isEditMode && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11"
            aria-label={`Diminuir ${lowerLabel} de ${skillLabel}`}
            disabled={disabled || isSaving || value <= 0}
            onClick={() => handleStep(-1)}
          >
            <Minus aria-hidden="true" />
          </Button>
        )}
        <EditableNumberField
          characterId={characterId}
          currentCharacterData={character}
          section="skills"
          field={field}
          value={value}
          min={min}
          isEditMode={isEditMode}
          displayClassName="justify-center text-center text-[19px] font-semibold"
        />
        {isEditMode && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-11"
            aria-label={`Aumentar ${lowerLabel} de ${skillLabel}`}
            disabled={disabled || isSaving}
            onClick={() => handleStep(1)}
          >
            <Plus aria-hidden="true" />
          </Button>
        )}
      </div>
      {state === 'error' && <InlineFieldRetry onRetry={() => handleStep(lastDelta.current)} />}
    </div>
  )
}
