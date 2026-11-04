// components/character/basic-info/vitality-card.tsx
// Card Vitalidade (total único). Dano e Cura abrem a sheet da barra inferior; os campos
// inline gravam currentVitality.current e vitality.race/class/perLevel, mesclados por buildUpdateData.

import { Heart, HeartPulse, Swords } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EditableNumberField } from '@/components/ui/editable-field'
import { NumericDisplay } from '@/components/ui/numeric-display'
import { SectionCard } from '@/components/ui/section-card'
import { cn } from '@/lib/utils'

import { formatGameNumber } from '../resource-display'
import { useQuickSheet } from '../quick-sheets/quick-sheet-context'
import { buildVitalityView } from './basic-info-model'

import type { CharacterTabProps } from '../types'

type VitalityCardProps = Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'>

const BADGE_CLASS =
  'inline-flex items-center gap-1.5 rounded-(--radius) border px-2.5 py-1 text-sm font-semibold'

export function VitalityCard({ character, characterId, isEditMode }: VitalityCardProps) {
  const { level, vitality = {}, currentVitality = {} } = character
  const view = buildVitalityView({ level, vitality, currentVitality })
  const { openSheet } = useQuickSheet()

  const badge = view.isConfigured ? undefined : (
    <span className={cn(BADGE_CLASS, 'border-border text-muted-foreground')}>
      <Heart className="size-4" aria-hidden="true" />
      Sem vitalidade definida
    </span>
  )

  return (
    <SectionCard title="Vitalidade" data-section="vitality" action={badge}>
      <NumericDisplay
        size="hero"
        value={formatGameNumber(view.current)}
        max={formatGameNumber(view.max)}
      />

      <div aria-hidden="true" className="h-2.5 overflow-hidden rounded-[1px] bg-vitality-track">
        <div className="h-full bg-vitality-notavel" style={{ width: `${view.percent}%` }} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => openSheet('vit')}
          className="h-12 border-destructive bg-transparent font-semibold text-destructive hover:bg-destructive/10"
        >
          <Swords className="size-[18px]" aria-hidden="true" />
          Dano
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => openSheet('vit')}
          className="h-12 bg-secondary font-semibold text-secondary-foreground"
        >
          <HeartPulse className="size-[18px]" aria-hidden="true" />
          Cura
        </Button>
      </div>

      <div className="grid min-h-11 -mx-2 grid-cols-[22px_1fr_auto] items-center gap-2.5 rounded-(--radius) px-2">
        <Heart
          className={cn('size-[18px]', view.isConfigured ? 'text-vitality-notavel' : 'text-muted-foreground')}
          aria-hidden="true"
        />
        <span className="text-[15px] font-semibold">Atual</span>
        <span className="flex items-baseline justify-end gap-1">
          <EditableNumberField
            characterId={characterId}
            currentCharacterData={character}
            section="currentVitality"
            field="current"
            value={view.current}
            displayClassName="justify-end px-1 text-[17px] font-semibold"
            isEditMode={isEditMode}
          />
          <span className="font-numeric text-sm tabular-nums text-muted-foreground">{`/ ${view.max}`}</span>
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <EditableNumberField
          characterId={characterId}
          currentCharacterData={character}
          section="vitality"
          field="race"
          value={view.base.race}
          label="Base da raça"
          isEditMode={isEditMode}
        />
        <EditableNumberField
          characterId={characterId}
          currentCharacterData={character}
          section="vitality"
          field="class"
          value={view.base.class}
          label="Base da classe"
          isEditMode={isEditMode}
        />
        <EditableNumberField
          characterId={characterId}
          currentCharacterData={character}
          section="vitality"
          field="perLevel"
          value={view.base.perLevel}
          label="Por nível"
          isEditMode={isEditMode}
        />
      </div>
    </SectionCard>
  )
}
