// components/character/basic-info/equipment-cards.tsx

import { Shield } from 'lucide-react'

import { EditableField, EditableNumberField, EditableTextArea } from '@/components/ui/editable-field'
import { SectionCard } from '@/components/ui/section-card'
import { cn } from '@/lib/utils'

import { getFillPercent, hasWeaponContent } from './basic-info-model'

import type { CharacterTabProps } from '../types'

type EquipmentCardProps = Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'>

const WEAPON_SLOTS = [0, 1, 2]

const DAMAGE_CELLS = [
  { key: 'd25', label: '25%', placeholder: '25%' },
  { key: 'd50', label: '50%', placeholder: '50%' },
  { key: 'd75', label: '75%', placeholder: '75%' },
  { key: 'd100', label: '100%', placeholder: '100%' },
  { key: 'critical', label: 'Crít.', placeholder: 'Crítico' },
] as const

export function WeaponsCard({ character, characterId, isEditMode }: EquipmentCardProps) {
  const { weapons = {} } = character

  // Bloqueada: só as armas com conteúdo. Desbloqueada: os três slots fixos
  const visibleSlots = isEditMode
    ? WEAPON_SLOTS
    : WEAPON_SLOTS.filter((index) => hasWeaponContent(weapons[index.toString()]))

  return (
    <SectionCard title="Armas" data-section="weapons">
      {visibleSlots.length === 0 && (
        <span className="text-sm text-muted-foreground">Nenhuma arma cadastrada.</span>
      )}

      {visibleSlots.map((weaponIndex) => {
        const weapon = weapons[weaponIndex.toString()] || {}

        return (
          <div key={weaponIndex} className="flex flex-col gap-2 border-b pb-3 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between gap-2">
              <EditableField
                characterId={characterId}
                currentCharacterData={character}
                section="weapons"
                field={`${weaponIndex}.name`}
                value={weapon.name}
                placeholder={`Nome da Arma ${weaponIndex + 1}`}
                isEditMode={isEditMode}
                className="min-w-0 flex-1"
                displayClassName="font-serif text-[17px] font-semibold"
              />
              <div className="flex shrink-0 items-center gap-1 rounded-(--radius) bg-secondary px-2 text-[13px] font-semibold">
                Nv
                <EditableNumberField
                  characterId={characterId}
                  currentCharacterData={character}
                  section="weapons"
                  field={`${weaponIndex}.level`}
                  value={weapon.level || 0}
                  min={0}
                  max={99}
                  isEditMode={isEditMode}
                  displayClassName="px-1 text-[13px] font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1">
              {DAMAGE_CELLS.map((cell) => (
                <div
                  key={cell.key}
                  className={cn(
                    'flex flex-col items-center gap-0.5 rounded-(--radius) px-0.5 py-1.5',
                    cell.key === 'critical' ? 'bg-accent' : 'bg-muted'
                  )}
                >
                  <span className="text-xs text-muted-foreground">{cell.label}</span>
                  <EditableField
                    characterId={characterId}
                    currentCharacterData={character}
                    section="weapons"
                    field={`${weaponIndex}.damage.${cell.key}`}
                    value={weapon.damage?.[cell.key]}
                    placeholder={cell.placeholder}
                    isEditMode={isEditMode}
                    className="w-full"
                    displayClassName={cn(
                      'justify-center px-1 font-numeric tabular-nums text-[17px] font-semibold',
                      cell.key === 'critical' && 'text-primary'
                    )}
                  />
                </div>
              ))}
            </div>

            {(isEditMode || (typeof weapon.description === 'string' && weapon.description !== '')) && (
              <EditableTextArea
                characterId={characterId}
                currentCharacterData={character}
                section="weapons"
                field={`${weaponIndex}.description`}
                value={weapon.description}
                placeholder="Observações/Descrição da arma"
                rows={2}
                isEditMode={isEditMode}
                displayClassName="text-sm text-muted-foreground"
              />
            )}
          </div>
        )
      })}

      {isEditMode && <span className="text-[13px] text-muted-foreground">Máximo de 3 armas.</span>}
    </SectionCard>
  )
}

export function ArmorCard({ character, characterId, isEditMode }: EquipmentCardProps) {
  const { armor = {} } = character
  const hasDescription = typeof armor.description === 'string' && armor.description !== ''

  return (
    <SectionCard
      title="Armadura"
      action={<Shield className="size-[18px] text-muted-foreground" aria-hidden="true" />}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <EditableField
            characterId={characterId}
            currentCharacterData={character}
            section="armor"
            field="name"
            value={armor.name}
            placeholder="Nome da armadura"
            isEditMode={isEditMode}
            displayClassName="font-serif text-[17px] font-semibold"
          />
          {(isEditMode || hasDescription) && (
            <EditableTextArea
              characterId={characterId}
              currentCharacterData={character}
              section="armor"
              field="description"
              value={armor.description}
              placeholder="Descrição da armadura"
              rows={2}
              isEditMode={isEditMode}
              displayClassName="text-sm text-muted-foreground"
            />
          )}
        </div>
        <div className="flex shrink-0 items-baseline gap-1">
          <EditableNumberField
            characterId={characterId}
            currentCharacterData={character}
            section="armor"
            field="currentVitality"
            value={armor.currentVitality || 0}
            isEditMode={isEditMode}
            displayClassName="px-1 text-[24px] font-semibold"
          />
          <span className="text-muted-foreground">/</span>
          <EditableNumberField
            characterId={characterId}
            currentCharacterData={character}
            section="armor"
            field="totalVitality"
            value={armor.totalVitality || 0}
            isEditMode={isEditMode}
            displayClassName="px-1 text-base text-muted-foreground"
          />
        </div>
      </div>

      <div aria-hidden="true" className="h-2 overflow-hidden rounded-[1px] bg-vitality-track">
        <div
          className="h-full bg-chart-5"
          style={{ width: `${getFillPercent(armor.currentVitality || 0, armor.totalVitality || 0)}%` }}
        />
      </div>
    </SectionCard>
  )
}
