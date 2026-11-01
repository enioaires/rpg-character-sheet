// components/character/basic-info/berkana-card.tsx
// Card Berkana. Não grava nada: Gastar e Recuperar abrem a sheet da barra inferior.
// Atual, Máxima e Bônus continuam editáveis em linha, nos mesmos caminhos de antes.

import { RotateCcw, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EditableNumberField } from '@/components/ui/editable-field'
import { SectionCard } from '@/components/ui/section-card'

import { BERKANA_STATE_DISPLAY } from '../resource-display'
import { useQuickSheet } from '../quick-sheets/quick-sheet-context'
import { buildBerkanaView } from './basic-info-model'

import type { CharacterTabProps } from '../types'

type BerkanaCardProps = Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'>

export function BerkanaCard({ character, characterId, isEditMode }: BerkanaCardProps) {
  const view = buildBerkanaView(character)
  const { openSheet } = useQuickSheet()
  const stateDisplay = BERKANA_STATE_DISPLAY[view.state]

  const stateBadge = (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-berkana">
      <stateDisplay.Icon className="size-4" aria-hidden="true" />
      {stateDisplay.label}
    </span>
  )

  return (
    <SectionCard title="Berkana" tone="berkana" data-section="berkana" action={stateBadge}>
      <div className="flex items-baseline gap-2">
        <EditableNumberField
          characterId={characterId}
          currentCharacterData={character}
          section="berkana"
          field="current"
          value={view.current}
          max={view.max}
          displayClassName="text-[44px] leading-none font-semibold"
          isEditMode={isEditMode}
        />
        <span className="font-numeric text-[20px] tabular-nums text-muted-foreground">{`/ ${view.max}`}</span>
      </div>

      <div aria-hidden="true" className="h-2.5 overflow-hidden rounded-[1px] bg-berkana-track">
        <div className="h-full bg-berkana" style={{ width: `${view.percent}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => openSheet('berk')}
          className="h-12 border-berkana bg-transparent font-semibold text-berkana hover:bg-berkana/10"
        >
          <Sparkles className="size-[18px]" aria-hidden="true" />
          Gastar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => openSheet('berk')}
          className="h-12 bg-secondary font-semibold"
        >
          <RotateCcw className="size-[18px]" aria-hidden="true" />
          Recuperar
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <EditableNumberField
          characterId={characterId}
          currentCharacterData={character}
          section="berkana"
          field="max"
          value={view.max}
          label="Máxima"
          isEditMode={isEditMode}
        />
        <EditableNumberField
          characterId={characterId}
          currentCharacterData={character}
          section="berkana"
          field="bonus"
          value={view.bonus}
          label="Bônus"
          isEditMode={isEditMode}
        />
      </div>
    </SectionCard>
  )
}
