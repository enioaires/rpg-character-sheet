// components/character/spells-talents/talent-body.tsx
// Corpo da linha de talento (DS-06): leitura da descrição e os campos inline de sempre,
// com o controle de uso limitado. Nenhuma gravação aqui: o card é dono dos handlers.

import { EditableField, EditableTextArea, EditableNumberField } from '@/components/ui/editable-field'
import { Checkbox } from '@/components/ui/checkbox'
import type { Talent } from '@/lib/schemas/character'
import type { CharacterTabProps } from '../types'

// Texto simples: a descrição entra como filho de texto do React, nunca como HTML
export function TalentDetails({ talent }: { talent: Talent }) {
  const description = typeof talent.description === 'string' ? talent.description : ''
  return description.trim() !== '' ? (
    <p className="m-0 whitespace-pre-line text-pretty text-[15px] leading-[1.55]">{description}</p>
  ) : (
    <p className="m-0 text-[15px] text-muted-foreground">Sem descrição.</p>
  )
}

interface TalentEditFieldsProps {
  talent: Talent
  index: number
  character: CharacterTabProps['character']
  characterId: string
  isEditMode: boolean
  isPending: boolean
  onOncePerDayChange: (checked: boolean) => void
}

export function TalentEditFields({
  talent,
  index,
  character,
  characterId,
  isEditMode,
  isPending,
  onOncePerDayChange,
}: TalentEditFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <EditableField
            characterId={characterId}
            currentCharacterData={character}
            section="talents"
            field={`${index}.name`}
            value={talent.name}
            placeholder="Nome do talento"
            label="Nome"
            isEditMode={isEditMode}
          />
        </div>
        <div>
          <EditableNumberField
            characterId={characterId}
            currentCharacterData={character}
            section="talents"
            field={`${index}.level`}
            value={talent.level || 0}
            label="Nível"
            className="text-center"
            isEditMode={isEditMode}
          />
        </div>
      </div>

      <div className="flex min-h-11 items-center gap-2">
        <Checkbox
          id={`talent-${index}-oncePerDay`}
          checked={talent.oncePerDay || false}
          onCheckedChange={checked => onOncePerDayChange(checked === true)}
          disabled={!isEditMode || isPending}
        />
        <label
          htmlFor={`talent-${index}-oncePerDay`}
          className="cursor-pointer text-sm text-muted-foreground"
        >
          Uso limitado (1× ao dia)
        </label>
      </div>

      <div>
        <EditableTextArea
          characterId={characterId}
          currentCharacterData={character}
          section="talents"
          field={`${index}.description`}
          value={talent.description}
          placeholder="Descrição do talento"
          label="Descrição"
          rows={2}
          isEditMode={isEditMode}
        />
      </div>
    </>
  )
}
