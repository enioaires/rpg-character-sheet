// components/character/basic-info/languages-card.tsx

import { Check, Minus, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { EditableField } from '@/components/ui/editable-field'
import { INLINE_FIELD_LABEL_CLASS } from '@/components/ui/inline-field-state'
import { SectionCard } from '@/components/ui/section-card'
import { isCharacterConflictError } from '@/lib/api/character-concurrency'
import { cn } from '@/lib/utils'

import { buildLanguageChips } from './basic-info-model'

import type { CharacterTabProps, UpdateCharacterMutation } from '../types'

interface LanguagesCardProps extends Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'> {
  updateCharacterMutation: UpdateCharacterMutation
}

const CHIP_CLASS = 'inline-flex min-h-11 items-center gap-1.5 rounded-(--radius) border px-3.5 text-[15px] font-medium'

interface LanguageChipProps {
  label: string
  known: boolean
  isEditMode: boolean
  disabled: boolean
  onToggle: () => void
}

// Desbloqueada: botão que alterna. Bloqueada: texto estático, sem aria-pressed
function LanguageChip({ label, known, isEditMode, disabled, onToggle }: LanguageChipProps) {
  const Icon = known ? Check : Minus
  const chipClass = cn(
    CHIP_CLASS,
    known ? 'border-input bg-secondary text-foreground' : 'border-border bg-transparent text-muted-foreground'
  )

  if (!isEditMode) {
    return (
      <span className={chipClass}>
        <Icon className="size-4" aria-hidden="true" />
        {label}
        <span className="sr-only">{known ? 'conhecida' : 'não conhecida'}</span>
      </span>
    )
  }

  return (
    <button type="button" aria-pressed={known} disabled={disabled} onClick={onToggle} className={chipClass}>
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  )
}

export function LanguagesCard({ character, characterId, isEditMode, updateCharacterMutation }: LanguagesCardProps) {
  const { languages = {} } = character
  const chips = buildLanguageChips(languages)
  const isPending = updateCharacterMutation.isPending

  // Conflito já tem toast e refetch próprios em useUpdateCharacter
  const reportSaveError = (logMessage: string, error: unknown) => {
    console.error(logMessage, error)
    if (!isCharacterConflictError(error)) {
      toast.error('Não foi possível salvar a linguagem')
    }
  }

  const handleLanguageChange = async (lang: string, checked: boolean) => {
    try {
      const updateData = {
        languages: {
          ...languages,
          standard: {
            ...languages.standard,
            [lang]: checked
          }
        }
      }
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: updateData
      })
    } catch (error) {
      reportSaveError('Erro ao atualizar linguagem:', error)
    }
  }

  const handleAddLanguage = async () => {
    try {
      const newCustomLanguages = [...(languages.custom || []), { name: '', known: false }]
      const updateData = {
        languages: {
          ...languages,
          custom: newCustomLanguages
        }
      }
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: updateData
      })
    } catch (error) {
      reportSaveError('Erro ao adicionar linguagem:', error)
    }
  }

  const handleCustomLanguageChange = async (index: number, checked: boolean) => {
    try {
      const updatedCustom = [...languages.custom]
      updatedCustom[index] = { ...updatedCustom[index], known: checked }

      const updateData = {
        languages: {
          ...languages,
          custom: updatedCustom
        }
      }
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: updateData
      })
    } catch (error) {
      reportSaveError('Erro ao atualizar linguagem customizada:', error)
    }
  }

  return (
    <SectionCard title="Linguagens" className="gap-3">
      <div className="flex flex-wrap gap-2">
        {chips.standard.map((chip) => (
          <LanguageChip
            key={chip.key}
            label={chip.label}
            known={chip.known}
            isEditMode={isEditMode}
            disabled={isPending}
            onToggle={() => handleLanguageChange(chip.key, !chip.known)}
          />
        ))}
        {chips.custom.map((chip) => (
          <LanguageChip
            key={`custom-${chip.index}`}
            label={chip.name || 'Sem nome'}
            known={chip.known}
            isEditMode={isEditMode}
            disabled={isPending}
            onToggle={() => handleCustomLanguageChange(chip.index, !chip.known)}
          />
        ))}
        {isEditMode && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleAddLanguage}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-(--radius) border border-dashed border-input bg-transparent px-3.5 text-[15px] text-muted-foreground"
          >
            <Plus className="size-4" aria-hidden="true" />
            Outra
          </button>
        )}
      </div>

      {isEditMode && chips.custom.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className={INLINE_FIELD_LABEL_CLASS}>Outras linguagens</span>
          {chips.custom.map((chip) => (
            <EditableField
              key={chip.index}
              characterId={characterId}
              currentCharacterData={character}
              section="languages"
              field={`custom.${chip.index}.name`}
              value={chip.name}
              placeholder="Nome da linguagem"
              isEditMode={isEditMode}
            />
          ))}
        </div>
      )}
    </SectionCard>
  )
}
