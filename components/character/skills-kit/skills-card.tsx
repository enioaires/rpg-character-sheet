// components/character/skills-kit/skills-card.tsx
// Card Perícias: faixa de pontos, filtro "Em uso / Todas", legenda e linhas agrupadas.
import { useState } from 'react'
import { Maximize2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SectionCard } from '@/components/ui/section-card'
import { StatTile } from '@/components/ui/stat-tile'
import { getSkillLevelBonus } from '@/lib/calculations'
import { SKILLS } from '@/lib/constants/character'
import { cn } from '@/lib/utils'

import type { CharacterTabProps, UpdateCharacterMutation } from '../types'
import {
  buildSkillGroups,
  buildSkillStepUpdate,
  countSkillsInUse,
  formatSkillTotalCaption,
  getSkillPointSummary,
  type SkillFilter,
  type SkillKey,
  type SkillRowModel,
  type SkillStepField,
} from './skills-kit-model'
import { SkillRow } from './skill-row'

type SkillsCardProps = Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'> & {
  updateCharacterMutation: UpdateCharacterMutation
  onOpenSkillsOverview?: () => void
}

export function SkillsCard({
  character,
  characterId,
  isEditMode,
  updateCharacterMutation,
  onOpenSkillsOverview,
}: SkillsCardProps) {
  const { level, skills = {}, attributes } = character
  // Abre em "Em uso" quando há perícias com pontos; senão "Todas", para não mostrar lista vazia
  const [filter, setFilter] = useState<SkillFilter>(() =>
    countSkillsInUse(skills) > 0 ? 'uso' : 'todas',
  )
  const [openSkill, setOpenSkill] = useState<SkillKey | null>(null)

  const { available, used, remaining } = getSkillPointSummary(skills, level)
  const inUseCount = countSkillsInUse(skills)
  const groups = buildSkillGroups(skills, level, filter, openSkill, attributes)
  const levelBonus = getSkillLevelBonus(level || 0)

  // Os erros sobem para o stepper, que mostra o estado e o botão de tentar de novo
  const handleStep = async (row: SkillRowModel, field: SkillStepField, delta: number) => {
    await updateCharacterMutation.mutateAsync({
      id: characterId,
      data: buildSkillStepUpdate(skills, row.key, field, delta, row.max),
    })
  }

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
          {group.rows.map((row) => (
            <SkillRow
              key={row.key}
              row={row}
              isOpen={openSkill === row.key}
              onToggle={() => setOpenSkill(openSkill === row.key ? null : row.key)}
              levelBonus={levelBonus}
              isEditMode={isEditMode}
              characterId={characterId}
              character={character}
              isStepDisabled={updateCharacterMutation.isPending}
              onStep={(field, delta) => handleStep(row, field, delta)}
            />
          ))}
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
