// components/character/skills-kit/skills-card.tsx
// Card Perícias: faixa de pontos, filtro "Em uso / Todas", legenda e linhas agrupadas.
import { useState } from 'react'
import { Maximize2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EditableNumberField } from '@/components/ui/editable-field'
import { SectionCard } from '@/components/ui/section-card'
import { StatTile } from '@/components/ui/stat-tile'
import { getSkillLevelBonus } from '@/lib/calculations'
import { SKILLS } from '@/lib/constants/character'
import { cn } from '@/lib/utils'

import type { CharacterTabProps, UpdateCharacterMutation } from '../types'
import {
  buildSkillGroups,
  countSkillsInUse,
  formatSkillTotalCaption,
  getSkillPointSummary,
  type SkillFilter,
  type SkillKey,
} from './skills-kit-model'

type SkillsCardProps = Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'> & {
  updateCharacterMutation: UpdateCharacterMutation
  onOpenSkillsOverview?: () => void
}

export function SkillsCard({
  character,
  characterId,
  isEditMode,
  onOpenSkillsOverview,
}: SkillsCardProps) {
  const { level, skills = {} } = character
  // Abre em "Em uso" quando há perícias com pontos; senão "Todas", para não mostrar lista vazia
  const [filter, setFilter] = useState<SkillFilter>(() =>
    countSkillsInUse(skills) > 0 ? 'uso' : 'todas',
  )
  const [openSkill, setOpenSkill] = useState<SkillKey | null>(null)

  const { available, used, remaining } = getSkillPointSummary(skills, level)
  const inUseCount = countSkillsInUse(skills)
  const groups = buildSkillGroups(skills, level, filter, openSkill)
  const levelBonus = getSkillLevelBonus(level || 0)

  return (
    <SectionCard
      title="Perícias"
      data-section="skills"
      className="gap-3"
      action={
        onOpenSkillsOverview ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11 text-muted-foreground"
            aria-label="Ver perícias"
            onClick={onOpenSkillsOverview}
          >
            <Maximize2 className="size-[18px]" aria-hidden="true" />
          </Button>
        ) : undefined
      }
    >
      <div
        role="group"
        aria-label={`Pontos de perícia: ${available} disponíveis, ${used} gastos, ${remaining} restantes`}
        className="grid grid-cols-3 rounded-(--radius) border"
      >
        <StatTile variant="bare" label="Disponíveis" value={available} />
        <StatTile variant="bare" label="Gastos" value={used} className="border-l" />
        <StatTile
          variant="bare"
          label="Restantes"
          value={remaining}
          className="border-l"
          valueClassName={remaining < 0 ? 'text-destructive' : 'text-foreground'}
        />
      </div>

      <div className="grid grid-cols-2 rounded-(--radius) bg-muted p-[3px]">
        {(
          [
            ['uso', `Em uso · ${inUseCount}`],
            ['todas', `Todas · ${SKILLS.length}`],
          ] as const
        ).map(([value, text]) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={cn(
              'h-11 rounded-(--radius) text-[15px] font-semibold',
              filter === value ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground',
            )}
          >
            {text}
          </button>
        ))}
      </div>

      <span className="text-[13px] text-muted-foreground">{formatSkillTotalCaption(level)}</span>

      {groups.map((group) => (
        <div key={group.name} className="flex flex-col">
          <div className="flex justify-between pt-2.5 pb-1 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            <h3>{group.name}</h3>
            <span>{group.rows.length}</span>
          </div>
          {group.rows.map((row) => {
            const isOpen = openSkill === row.key
            return (
              <div key={row.key}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`skill-detail-${row.key}`}
                  aria-label={`${row.label}, total ${row.total}`}
                  onClick={() => setOpenSkill(isOpen ? null : row.key)}
                  className={cn(
                    'grid min-h-[46px] w-full grid-cols-[minmax(0,1fr)_auto_44px] items-center gap-2.5 border-t text-left',
                    row.inUse ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <span className="truncate text-[15px]">{row.label}</span>
                  <span className="font-numeric text-[13px] tabular-nums text-muted-foreground">
                    {row.detail}
                  </span>
                  <span className="font-numeric text-right text-[21px] font-semibold tabular-nums">
                    {row.total}
                  </span>
                </button>
                {isOpen && (
                  <div id={`skill-detail-${row.key}`} className="grid grid-cols-2 gap-2.5 pt-1 pb-3">
                    <EditableNumberField
                      label="Distribuídos"
                      characterId={characterId}
                      currentCharacterData={character}
                      section="skills"
                      field={`${row.key}.distributed`}
                      value={row.distributed}
                      min={0}
                      isEditMode={isEditMode}
                    />
                    <EditableNumberField
                      label="Bônus"
                      characterId={characterId}
                      currentCharacterData={character}
                      section="skills"
                      field={`${row.key}.bonus`}
                      value={row.bonus}
                      isEditMode={isEditMode}
                    />
                    <span className="col-span-2 text-xs text-muted-foreground">
                      {`Base 1 · Nível +${levelBonus}`}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {filter === 'uso' && groups.length === 0 && (
        <div className="flex flex-col items-start gap-1">
          <p className="text-sm text-muted-foreground">Nenhuma perícia em uso.</p>
          <Button type="button" variant="ghost" className="h-11" onClick={() => setFilter('todas')}>
            Ver todas
          </Button>
        </div>
      )}
    </SectionCard>
  )
}
