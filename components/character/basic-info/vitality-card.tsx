// components/character/basic-info/vitality-card.tsx
// Card Vitalidade. Não grava nada: Dano e Cura abrem a sheet da barra inferior,
// que é a única origem das gravações de vitalidade.

import { Heart, HeartPulse, Swords } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EditableNumberField } from '@/components/ui/editable-field'
import { NumericDisplay } from '@/components/ui/numeric-display'
import { SectionCard } from '@/components/ui/section-card'
import { VITALITY_LEVELS } from '@/lib/constants/character'
import { cn } from '@/lib/utils'

import { formatGameNumber, VITALITY_STAGE_DISPLAY } from '../resource-display'
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
  const stageDisplay = view.stage ? VITALITY_STAGE_DISPLAY[view.stage] : null

  const badge = stageDisplay ? (
    <span className={cn(BADGE_CLASS, stageDisplay.borderClassName, stageDisplay.textClassName)}>
      <stageDisplay.Icon className="size-4" aria-hidden="true" />
      {stageDisplay.label}
      <span className="font-numeric tabular-nums opacity-80">{`${view.stagePosition}/${VITALITY_LEVELS.length}`}</span>
    </span>
  ) : (
    <span className={cn(BADGE_CLASS, 'border-border text-muted-foreground')}>
      <Heart className="size-4" aria-hidden="true" />
      Sem vitalidade definida
    </span>
  )

  return (
    <SectionCard title="Vitalidade" data-section="vitality" action={badge}>
      <NumericDisplay
        size="hero"
        value={formatGameNumber(view.currentTotal)}
        max={formatGameNumber(view.maxTotal)}
      />

      <div aria-hidden="true" className="flex h-2.5 gap-[3px]">
        {view.rows.map((row) => (
          <div
            key={row.key}
            className="flex flex-1 justify-end overflow-hidden rounded-[1px] bg-vitality-track"
          >
            <div
              className={VITALITY_STAGE_DISPLAY[row.key].bgClassName}
              style={{ width: `${row.percent}%` }}
            />
          </div>
        ))}
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

      <div className="flex flex-col">
        {view.rows.map((row) => {
          const display = VITALITY_STAGE_DISPLAY[row.key]
          return (
            <div
              key={row.key}
              className={cn(
                'grid min-h-11 -mx-2 grid-cols-[22px_1fr_auto] items-center gap-2.5 rounded-(--radius) px-2',
                row.isCurrent && 'bg-muted'
              )}
            >
              <display.Icon
                className={cn('size-[18px]', view.stage ? display.textClassName : 'text-muted-foreground')}
                aria-hidden="true"
              />
              <span className="flex min-w-0 items-center gap-2 text-[15px]">
                <span className={row.isCurrent ? 'font-bold' : 'font-normal'}>{display.label}</span>
                {row.isCurrent && (
                  <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">atual</span>
                )}
              </span>
              <span className="flex items-baseline justify-end gap-1">
                <EditableNumberField
                  characterId={characterId}
                  currentCharacterData={character}
                  section="currentVitality"
                  field={row.key}
                  value={row.current}
                  displayClassName="justify-end px-1 text-[17px] font-semibold"
                  isEditMode={isEditMode}
                />
                <span className="font-numeric text-sm tabular-nums text-muted-foreground">{`/ ${row.max}`}</span>
              </span>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <EditableNumberField
          characterId={characterId}
          currentCharacterData={character}
          section="vitality"
          field="race"
          value={vitality.race || 0}
          label="Base da raça"
          isEditMode={isEditMode}
        />
        <EditableNumberField
          characterId={characterId}
          currentCharacterData={character}
          section="vitality"
          field="class"
          value={vitality.class || 0}
          label="Base da classe"
          isEditMode={isEditMode}
        />
      </div>

      <span className="text-[13px] text-muted-foreground">O dano desce do Notável até o Coma.</span>
    </SectionCard>
  )
}
