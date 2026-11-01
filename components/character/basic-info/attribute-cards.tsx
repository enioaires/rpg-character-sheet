// components/character/basic-info/attribute-cards.tsx
// Card Atributos: grade de totais (com bônus de nível) e tabela de distribuição recolhida.

import { useId, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { EditableNumberField } from '@/components/ui/editable-field'
import { SectionCard } from '@/components/ui/section-card'
import { StatTile } from '@/components/ui/stat-tile'
import { getAttributeLevelBonus } from '@/lib/calculations'

import { buildAttributeRows } from './basic-info-model'

import type { CharacterTabProps } from '../types'

type AttributesCardProps = Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'>

const CELL_CLASS = 'justify-center px-1 text-base'
const TABLE_GRID = 'grid grid-cols-[minmax(0,1fr)_repeat(3,2.75rem)_2.25rem_2.5rem] gap-0.5'

export function AttributesCard({ character, characterId, isEditMode }: AttributesCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const tableId = useId()

  const { level, attributes = {} } = character
  const rows = buildAttributeRows(attributes, level)
  const levelBonus = getAttributeLevelBonus(level || 0)
  const ToggleIcon = isExpanded ? ChevronUp : ChevronDown

  return (
    <SectionCard
      title="Atributos"
      className="gap-3"
      action={
        levelBonus > 0 ? (
          <span className="text-[13px] text-muted-foreground">{`inclui +${levelBonus} de nível`}</span>
        ) : undefined
      }
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1.5">
        {rows.map((row) => (
          <StatTile key={row.key} label={row.label} value={row.total} />
        ))}
      </div>

      <button
        type="button"
        aria-expanded={isExpanded}
        aria-controls={tableId}
        onClick={() => setIsExpanded((open) => !open)}
        className="flex h-11 w-full items-center justify-between border-t bg-transparent text-[15px] font-semibold"
      >
        Distribuição (raça + classe + bônus + nível)
        <ToggleIcon className="size-[18px]" aria-hidden="true" />
      </button>

      {isExpanded && (
        <div id={tableId} className="flex flex-col text-sm">
          <div className={`${TABLE_GRID} pb-1.5 text-center text-xs text-muted-foreground`}>
            <span className="text-left">Atributo</span>
            <span>Raça</span>
            <span>Cla.</span>
            <span>Bôn.</span>
            <span>Nív.</span>
            <span>Total</span>
          </div>
          {rows.map((row) => (
            <div key={row.key} className={`${TABLE_GRID} min-h-11 items-center border-t text-center`}>
              <span className="truncate text-left" title={row.label}>
                {row.label}
              </span>
              <EditableNumberField
                characterId={characterId}
                currentCharacterData={character}
                section="attributes"
                field={`${row.key}.race`}
                value={row.race}
                displayClassName={CELL_CLASS}
                isEditMode={isEditMode}
              />
              <EditableNumberField
                characterId={characterId}
                currentCharacterData={character}
                section="attributes"
                field={`${row.key}.class`}
                value={row.class}
                displayClassName={CELL_CLASS}
                isEditMode={isEditMode}
              />
              <EditableNumberField
                characterId={characterId}
                currentCharacterData={character}
                section="attributes"
                field={`${row.key}.bonus`}
                value={row.bonus}
                displayClassName={CELL_CLASS}
                isEditMode={isEditMode}
              />
              <span className="font-numeric tabular-nums text-muted-foreground">{row.levelBonus}</span>
              <span className="font-numeric font-bold tabular-nums text-primary">{row.total}</span>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
