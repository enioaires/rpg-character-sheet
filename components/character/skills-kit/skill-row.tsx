// components/character/skills-kit/skill-row.tsx
// Linha de perícia expansível: total + detalhe; aberta, mostra os steppers (desbloqueado) ou só os valores.
import { cn } from '@/lib/utils'

import type { CharacterData } from '../types'
import { SkillStepper } from './skill-stepper'
import type { SkillRowModel, SkillStepField } from './skills-kit-model'

interface SkillRowProps {
  row: SkillRowModel
  isOpen: boolean
  onToggle: () => void
  levelBonus: number
  isEditMode: boolean
  characterId: string
  character: CharacterData
  isStepDisabled: boolean
  onStep: (field: SkillStepField, delta: number) => Promise<void>
}

export function SkillRow({
  row,
  isOpen,
  onToggle,
  levelBonus,
  isEditMode,
  characterId,
  character,
  isStepDisabled,
  onStep,
}: SkillRowProps) {
  const detailId = `skill-detail-${row.key}`

  return (
    <div>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={detailId}
        aria-label={`${row.label}, total ${row.total}`}
        onClick={onToggle}
        className={cn(
          'grid min-h-[46px] w-full grid-cols-[minmax(0,1fr)_auto_44px] items-center gap-2.5 border-t text-left',
          row.inUse ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <span className="truncate text-[15px]">{row.label}</span>
        <span
          className={cn(
            'font-numeric text-[13px] tabular-nums',
            row.isOverCap ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {row.detail}
        </span>
        <span className="font-numeric text-right text-[21px] font-semibold tabular-nums">
          {row.total}
        </span>
      </button>
      {isOpen && (
        <div id={detailId} className="grid grid-cols-2 gap-2.5 pt-1 pb-3">
          <SkillStepper
            label="Distribuídos"
            skillLabel={row.label}
            characterId={characterId}
            character={character}
            field={`${row.key}.distributed`}
            value={row.distributed}
            min={0}
            max={row.max}
            isOverCap={row.isOverCap}
            isEditMode={isEditMode}
            disabled={isStepDisabled}
            onStep={(delta) => onStep('distributed', delta)}
          />
          <SkillStepper
            label="Bônus"
            skillLabel={row.label}
            characterId={characterId}
            character={character}
            field={`${row.key}.bonus`}
            value={row.bonus}
            isEditMode={isEditMode}
            disabled={isStepDisabled}
            onStep={(delta) => onStep('bonus', delta)}
          />
          <span className="col-span-2 text-xs text-muted-foreground">
            {`Base 1 · Nível +${levelBonus} · máx ${row.max} · ${row.attributeAbbr}`}
          </span>
        </div>
      )}
    </div>
  )
}
