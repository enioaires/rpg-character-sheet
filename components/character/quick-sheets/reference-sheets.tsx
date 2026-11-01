'use client'

import { useState } from 'react'

import { BottomSheet } from '@/components/ui/bottom-sheet'
import { StatTile } from '@/components/ui/stat-tile'
import { calculateAttributeTotal, calculateSkillTotal, toAttributeValue, toSkillValue } from '@/lib/calculations'
import { ATTRIBUTES, ATTRIBUTE_LABELS, SKILLS, SKILL_LABELS } from '@/lib/constants/character'
import { cn } from '@/lib/utils'
import type { CharacterData } from '@/components/character/types'

// Sheets de consulta: só leem a ficha, sem mutação nem tratamento de bloqueio

interface ReferenceSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  character: CharacterData
}

// ============================================
// ARMAS
// ============================================

const DAMAGE_CELLS = [
  { key: 'd25', label: '25%' },
  { key: 'd50', label: '50%' },
  { key: 'd75', label: '75%' },
  { key: 'd100', label: '100%' },
  { key: 'critical', label: 'Crít.' },
] as const

type WeaponView = {
  index: number
  name: string
  level: number
  damage: Record<(typeof DAMAGE_CELLS)[number]['key'], string>
  description: string
}

const asText = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null

// Lê as armas como o WeaponsCard: índices 0..2, buracos nulos e formatos antigos tolerados
function readWeapons(weapons: unknown): WeaponView[] {
  const source = asRecord(weapons)
  if (!source) return []

  const views: WeaponView[] = []
  for (const index of [0, 1, 2]) {
    const entry = asRecord(source[String(index)])
    if (!entry) continue

    const damageSource = asRecord(entry.damage)
    const damage = {
      d25: asText(damageSource?.d25),
      d50: asText(damageSource?.d50),
      d75: asText(damageSource?.d75),
      d100: asText(damageSource?.d100),
      critical: asText(damageSource?.critical),
    }
    const name = asText(entry.name)
    const level = typeof entry.level === 'number' && Number.isFinite(entry.level) ? entry.level : 0
    const hasDamage = Object.values(damage).some((cell) => cell !== '')

    if (!name && !level && !hasDamage) continue

    views.push({ index, name, level, damage, description: asText(entry.description) })
  }
  return views
}

export function WeaponsSheetBody({ weapons }: { weapons: unknown }) {
  const views = readWeapons(weapons)

  if (views.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma arma cadastrada. Preencha em Básicos → Armas.
      </p>
    )
  }

  return (
    <>
      {views.map((weapon) => (
        <div key={weapon.index} className="flex flex-col gap-1.5 border-b pb-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-serif text-[17px] font-semibold">
              {weapon.name || `Arma ${weapon.index + 1}`}
            </span>
            <span className="font-numeric font-semibold tabular-nums text-muted-foreground">
              Nv {weapon.level || 0}
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {DAMAGE_CELLS.map((cell) => {
              const isCritical = cell.key === 'critical'
              return (
                <div
                  key={cell.key}
                  className={cn(
                    'flex flex-col items-center rounded-(--radius) px-0.5 py-1.5',
                    isCritical ? 'bg-accent text-primary' : 'bg-muted'
                  )}
                >
                  <span className="text-xs text-muted-foreground">{cell.label}</span>
                  <span className="font-numeric text-lg font-semibold tabular-nums">
                    {weapon.damage[cell.key] || '—'}
                  </span>
                </div>
              )
            })}
          </div>
          {weapon.description && (
            <p className="text-sm text-muted-foreground">{weapon.description}</p>
          )}
        </div>
      ))}
    </>
  )
}

export function WeaponsSheet({ open, onOpenChange, character }: ReferenceSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Armas">
      <WeaponsSheetBody weapons={character.weapons} />
    </BottomSheet>
  )
}

// ============================================
// ATRIBUTOS
// ============================================

type AttributesInput = CharacterData['attributes'] | null | undefined

// Total com bônus de nível (calculateAttributeTotal), por decisão do dono em 2026-11-01:
// o mesmo número do card de Atributos da aba Básicos
export function AttributesSheetBody({
  attributes,
  level,
}: {
  attributes: AttributesInput
  level: number | null | undefined
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {ATTRIBUTES.map((attributeKey) => (
        <StatTile
          key={attributeKey}
          label={ATTRIBUTE_LABELS[attributeKey]}
          value={calculateAttributeTotal(toAttributeValue(attributes?.[attributeKey]), level || 0)}
        />
      ))}
    </div>
  )
}

export function AttributesSheet({ open, onOpenChange, character }: ReferenceSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Atributos">
      <AttributesSheetBody attributes={character.attributes} level={character.level} />
    </BottomSheet>
  )
}

// ============================================
// PERÍCIAS
// ============================================

type SkillsInput = CharacterData['skills'] | null | undefined

export function SkillsSheetBody({ skills, level }: { skills: SkillsInput; level: number | null | undefined }) {
  const rows = SKILLS.map((skillKey) => {
    const skill = toSkillValue(skills?.[skillKey])
    return {
      key: skillKey,
      label: SKILL_LABELS[skillKey],
      total: calculateSkillTotal(skill, level || 0),
      inUse: skill.distributed !== 0 || skill.bonus !== 0,
    }
  })
  const inUseRows = rows.filter((row) => row.inUse)

  // Começa em "Em uso" quando há perícia usada; senão mostra todas
  const [showAll, setShowAll] = useState(inUseRows.length === 0)
  const visibleRows = showAll ? rows : inUseRows
  const otherSkillsValue = calculateSkillTotal(toSkillValue(undefined), level || 0)

  const filters = [
    { id: 'used', label: `Em uso · ${inUseRows.length}`, active: !showAll, onSelect: () => setShowAll(false) },
    { id: 'all', label: `Todas · ${SKILLS.length}`, active: showAll, onSelect: () => setShowAll(true) },
  ]

  return (
    <>
      <div className="grid grid-cols-2 rounded-(--radius) bg-muted p-[3px]">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            aria-pressed={filter.active}
            onClick={filter.onSelect}
            className={cn(
              'h-10 rounded-(--radius) text-[15px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
              filter.active ? 'bg-card text-foreground shadow-card' : 'text-muted-foreground'
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <p className="-mt-1.5 text-[13px] text-muted-foreground">
        {showAll ? 'Todas as perícias' : `Em uso · as outras valem ${otherSkillsValue}`}
      </p>
      <div className="grid grid-cols-2 gap-x-3.5">
        {visibleRows.map((row) => (
          <div key={row.key} className="flex min-h-[38px] items-center justify-between gap-1.5 border-b">
            <span className="truncate text-sm">{row.label}</span>
            <span className="font-numeric text-[19px] font-semibold tabular-nums">{row.total}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export function SkillsSheet({ open, onOpenChange, character }: ReferenceSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Perícias">
      <SkillsSheetBody skills={character.skills} level={character.level} />
    </BottomSheet>
  )
}
