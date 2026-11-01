// components/character/basic-info/profile-cards.tsx

import { EditableField, EditableNumberField } from '@/components/ui/editable-field'
import { SectionCard } from '@/components/ui/section-card'

import { buildExperienceView } from './basic-info-model'

import type { CharacterTabProps } from '../types'

type BasicInfoField =
  | 'characterName'
  | 'playerName'
  | 'class'
  | 'race'
  | 'deity'
  | 'homeland'
  | 'alignment'
  | 'gender'
  | 'age'
  | 'weight'
  | 'height'
  | 'virtuePoints'

// Os 12 campos de hoje, na ordem de hoje, com os mesmos rótulos e placeholders
const BASIC_INFO_FIELDS: ReadonlyArray<{ field: BasicInfoField; label: string; placeholder: string }> = [
  { field: 'characterName', label: 'Nome do Personagem', placeholder: 'Digite o nome do personagem' },
  { field: 'playerName', label: 'Jogador', placeholder: 'Digite o nome do jogador' },
  { field: 'class', label: 'Classe', placeholder: 'Digite a classe' },
  { field: 'race', label: 'Raça', placeholder: 'Digite a raça' },
  { field: 'deity', label: 'Divindade', placeholder: 'Digite a divindade' },
  { field: 'homeland', label: 'Terra Natal', placeholder: 'Digite a terra natal' },
  { field: 'alignment', label: 'Tendência', placeholder: 'Digite a tendência' },
  { field: 'gender', label: 'Gênero', placeholder: 'Digite o gênero' },
  { field: 'age', label: 'Idade', placeholder: 'Digite a idade' },
  { field: 'weight', label: 'Peso', placeholder: 'Digite o peso' },
  { field: 'height', label: 'Altura', placeholder: 'Digite a altura' },
  { field: 'virtuePoints', label: 'Pontos de Virtude', placeholder: 'Digite os pontos de virtude' },
]

type BasicDetailsCardProps = Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'>

export function BasicDetailsCard({ character, characterId, isEditMode }: BasicDetailsCardProps) {
  return (
    <SectionCard title="Informações Básicas">
      <div className="grid grid-cols-2 gap-x-3.5 gap-y-3">
        {BASIC_INFO_FIELDS.map(({ field, label, placeholder }) => (
          <EditableField
            key={field}
            characterId={characterId}
            section="basic"
            field={field}
            value={character[field]}
            label={label}
            placeholder={placeholder}
            isEditMode={isEditMode}
            className={field === 'characterName' ? 'col-span-2 min-w-0' : 'min-w-0'}
          />
        ))}
      </div>
    </SectionCard>
  )
}

type ExperienceCardProps = Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'>

export function ExperienceCard({ character, characterId, isEditMode }: ExperienceCardProps) {
  const { level, currentXP } = character
  const view = buildExperienceView(level, currentXP)

  return (
    <SectionCard title="Experiência e Nível" className="gap-3">
      <div className="flex items-center gap-4">
        <div className="flex size-[72px] shrink-0 flex-col items-center justify-center rounded-(--radius) border border-primary">
          <span className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Nível</span>
          <EditableNumberField
            characterId={characterId}
            section="basic"
            field="level"
            value={level || 0}
            min={0}
            max={99}
            className="w-full"
            displayClassName="justify-center px-1 text-[34px] leading-none font-semibold text-primary"
            isEditMode={isEditMode}
          />
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">XP</span>
            <span className="flex items-baseline gap-1">
              <EditableNumberField
                characterId={characterId}
                section="basic"
                field="currentXP"
                value={currentXP || 0}
                displayClassName="px-1 text-[20px] font-semibold"
                isEditMode={isEditMode}
              />
              <span className="font-numeric text-[15px] tabular-nums text-muted-foreground">{`/ ${view.required}`}</span>
            </span>
          </div>
          <div aria-hidden="true" className="h-2 overflow-hidden rounded-[1px] bg-vitality-track">
            <div className="h-full bg-primary" style={{ width: `${view.percent}%` }} />
          </div>
          <span className="text-[13px] text-muted-foreground">{view.caption}</span>
        </div>
      </div>
    </SectionCard>
  )
}
