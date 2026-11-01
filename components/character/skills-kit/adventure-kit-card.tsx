// components/character/skills-kit/adventure-kit-card.tsx
// Card Kit de Aventureiro: personalizados primeiro, "Adicionar item" e itens padrão recolhíveis.
// A ordem de exibição é só visual: edições e remoções usam sempre o índice de armazenamento.
import { useState } from 'react'
import { Backpack, ChevronDown, ChevronUp, Plus, RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { EditableField, EditableNumberField } from '@/components/ui/editable-field'
import { SectionCard } from '@/components/ui/section-card'
import { isCharacterConflictError } from '@/lib/api/character-concurrency'
import type { UpdateCharacterRequest } from '@/lib/schemas/character'

import type { CharacterTabProps, UpdateCharacterMutation } from '../types'
import {
  buildAddKitItemUpdate,
  buildRemoveKitItemUpdate,
  buildResetKitUpdate,
  partitionAdventureKit,
} from './skills-kit-model'

type AdventureKitCardProps = Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'> & {
  updateCharacterMutation: UpdateCharacterMutation
}

const SECTION_LABEL_CLASS =
  'text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground'

export function AdventureKitCard({
  character,
  characterId,
  isEditMode,
  updateCharacterMutation,
}: AdventureKitCardProps) {
  const [isStandardOpen, setIsStandardOpen] = useState(false)
  const adventureKit = character.adventureKit || []
  const { custom, standard } = partitionAdventureKit(adventureKit)
  const isPending = updateCharacterMutation.isPending

  // Conflito já mostra o toast do useUpdateCharacter; os demais erros ganham um aviso fixo
  const run = async (update: UpdateCharacterRequest, logLabel: string, errorMessage: string) => {
    try {
      await updateCharacterMutation.mutateAsync({ id: characterId, data: update })
    } catch (error) {
      console.error(logLabel, error)
      if (!isCharacterConflictError(error)) toast.error(errorMessage)
    }
  }

  return (
    <SectionCard
      title="Kit de Aventureiro"
      className="gap-2.5"
      action={<Backpack className="size-[18px] text-muted-foreground" aria-hidden="true" />}
    >
      {custom.length === 0 && standard.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhum item no kit</p>
      )}

      {custom.length > 0 && (
        <>
          <span className={`${SECTION_LABEL_CLASS} pt-1`}>{`Personalizados · ${custom.length}`}</span>
          {custom.map((entry) => (
            <div key={entry.index} className="flex min-h-11 items-center gap-2 border-t">
              <EditableField
                characterId={characterId}
                currentCharacterData={character}
                section="adventureKit"
                field={`${entry.index}.name`}
                value={entry.item.name}
                placeholder="Nome do item"
                isEditMode={isEditMode}
                className="min-w-0 flex-1"
              />
              <span className="text-muted-foreground">×</span>
              <EditableNumberField
                characterId={characterId}
                currentCharacterData={character}
                section="adventureKit"
                field={`${entry.index}.quantity`}
                value={entry.item.quantity || 1}
                min={0}
                isEditMode={isEditMode}
                className="w-16"
                displayClassName="text-[17px] font-semibold"
              />
              {isEditMode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-11 text-destructive hover:text-destructive"
                  aria-label={`Remover ${entry.item.name || 'item'}`}
                  disabled={isPending}
                  onClick={() =>
                    run(
                      buildRemoveKitItemUpdate(adventureKit, entry.index),
                      'Erro ao remover item:',
                      'Não foi possível remover o item',
                    )
                  }
                >
                  <X className="size-5" aria-hidden="true" />
                </Button>
              )}
            </div>
          ))}
        </>
      )}

      {isEditMode && (
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            run(
              buildAddKitItemUpdate(adventureKit),
              'Erro ao adicionar item:',
              'Não foi possível adicionar o item',
            )
          }
          className="flex h-11 w-full items-center justify-center gap-1.5 rounded-(--radius) border border-dashed border-input text-muted-foreground disabled:opacity-50"
        >
          <Plus className="size-4" aria-hidden="true" />
          Adicionar item
        </button>
      )}

      <button
        type="button"
        aria-expanded={isStandardOpen}
        aria-controls="kit-standard-items"
        onClick={() => setIsStandardOpen(!isStandardOpen)}
        className={`flex h-11 items-center justify-between border-t ${SECTION_LABEL_CLASS}`}
      >
        <span>{`Itens padrão · ${standard.length}`}</span>
        {isStandardOpen ? (
          <ChevronUp className="size-[18px]" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-[18px]" aria-hidden="true" />
        )}
      </button>

      {isStandardOpen && (
        <div id="kit-standard-items" className="flex flex-col">
          {standard.map((entry) => (
            <div
              key={entry.index}
              className="flex min-h-10 items-center justify-between gap-2.5 border-t"
            >
              <span className="min-w-0 flex-1 text-[15px]">{entry.item.name}</span>
              <span className="text-muted-foreground">×</span>
              <EditableNumberField
                characterId={characterId}
                currentCharacterData={character}
                section="adventureKit"
                field={`${entry.index}.quantity`}
                value={entry.item.quantity || 1}
                min={0}
                isEditMode={isEditMode}
                className="w-16"
                displayClassName="text-base font-semibold text-muted-foreground"
              />
            </div>
          ))}
          {isEditMode && (
            <Button
              type="button"
              variant="ghost"
              className="h-11 justify-start"
              disabled={isPending}
              onClick={() =>
                run(buildResetKitUpdate(), 'Erro ao resetar kit:', 'Não foi possível restaurar o kit')
              }
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Restaurar kit padrão
            </Button>
          )}
        </div>
      )}
    </SectionCard>
  )
}
