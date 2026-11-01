// components/character/spells-talents/spell-body.tsx
// Corpo da linha de magia (DS-06): leitura (destaque de dano, estatísticas, descrição) e os
// campos inline de sempre para edição. Nenhuma gravação aqui: os campos gravam pelos próprios
// componentes e as ações da linha ficam em spells-card.tsx.

import { EditableField, EditableTextArea, EditableNumberField } from '@/components/ui/editable-field'
import {
  EditableScalingField,
  calculateScaledValue,
  normalizeScalingData,
} from '@/components/ui/editable-scaling-field'
import { isBlankScaledTotal } from '@/lib/spells-talents'
import type { Spell } from '@/lib/schemas/character'
import type { CharacterTabProps } from '../types'

interface ScaledDisplay {
  total: string
  formula: string
  hasScaling: boolean
}

// Mesmos números que EditableScalingField mostra para as mesmas entradas
// (normalizeScalingData + calculateScaledValue, nunca reimplementados aqui)
export function getSpellScaledValues(
  spell: Spell,
  characterLevel: number
): { damage: ScaledDisplay; duration: ScaledDisplay } {
  const spellLevel = spell.level || 0
  const damageData = normalizeScalingData(spell.damage || { base: 0, perLevel: null }, 'damage')
  const durationData = normalizeScalingData(spell.duration || { base: '', perLevel: null }, 'duration')
  const damage = calculateScaledValue(damageData.base, damageData.perLevel, spellLevel, characterLevel)
  const duration = calculateScaledValue(durationData.base, durationData.perLevel, spellLevel, characterLevel)
  return {
    damage: {
      total: damage.total,
      formula: damage.formula,
      hasScaling: Boolean(damageData.perLevel && damageData.perLevel > 0),
    },
    duration: {
      total: duration.total,
      formula: duration.formula,
      hasScaling: Boolean(durationData.perLevel && durationData.perLevel > 0),
    },
  }
}

function textOrDash(value: unknown): string {
  return typeof value === 'string' && value.trim() !== '' ? value : '—'
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="break-words text-[15px] font-medium">{value}</span>
    </div>
  )
}

// Texto simples: a descrição entra como filho de texto do React, nunca como HTML
export function SpellDetails({ spell, characterLevel }: { spell: Spell; characterLevel: number }) {
  const { damage, duration } = getSpellScaledValues(spell, characterLevel)
  const damageBlank = isBlankScaledTotal(damage.total) && !damage.hasScaling
  const durationBlank = isBlankScaledTotal(duration.total) && !duration.hasScaling
  const description = typeof spell.description === 'string' ? spell.description : ''

  return (
    <>
      <div className="flex items-baseline justify-between gap-2.5 rounded-(--radius) border bg-background px-3 py-2.5">
        <span className="text-[13px] text-muted-foreground">Dano</span>
        <span className="text-right font-numeric text-xl font-semibold tabular-nums">
          {damageBlank ? '—' : damage.total}
          {damage.hasScaling && (
            <span className="ml-1.5 text-[13px] font-medium text-muted-foreground">{`(${damage.formula})`}</span>
          )}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3.5 gap-y-2">
        <Stat label="Tipo" value={textOrDash(spell.type)} />
        <Stat label="Alcance" value={textOrDash(spell.range)} />
        <Stat label="Duração" value={durationBlank ? '—' : duration.total} />
        <Stat label="Preparo" value={textOrDash(spell.prepTime)} />
        <Stat label="Resistência" value={textOrDash(spell.resistance)} />
        <Stat label="Concentração" value={textOrDash(spell.concentration)} />
      </div>
      {description.trim() !== '' ? (
        <p className="m-0 whitespace-pre-line text-pretty text-[15px] leading-[1.55]">{description}</p>
      ) : (
        <p className="m-0 text-[15px] text-muted-foreground">Sem descrição.</p>
      )}
    </>
  )
}

interface SpellEditFieldsProps {
  spell: Spell
  index: number
  character: CharacterTabProps['character']
  characterId: string
  isEditMode: boolean
}

// Os onze campos inline de sempre (mesmos componentes, section, caminhos e props)
export function SpellEditFields({ spell, index, character, characterId, isEditMode }: SpellEditFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <EditableField
            characterId={characterId}
            currentCharacterData={character}
            section="spells"
            field={`${index}.name`}
            value={spell.name}
            placeholder="Nome da magia"
            label="Nome"
            isEditMode={isEditMode}
          />
        </div>
        <div>
          <EditableNumberField
            characterId={characterId}
            currentCharacterData={character}
            section="spells"
            field={`${index}.level`}
            value={spell.level || 0}
            label="Nível"
            className="text-center"
            isEditMode={isEditMode}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <EditableNumberField
            characterId={characterId}
            currentCharacterData={character}
            section="spells"
            field={`${index}.berkanaCost`}
            value={spell.berkanaCost || 0}
            label="Custo"
            className="text-center"
            isEditMode={isEditMode}
          />
        </div>
        <div>
          <EditableField
            characterId={characterId}
            currentCharacterData={character}
            section="spells"
            field={`${index}.type`}
            value={spell.type}
            placeholder="Tipo"
            label="Tipo"
            isEditMode={isEditMode}
          />
        </div>
        <div>
          <EditableField
            characterId={characterId}
            currentCharacterData={character}
            section="spells"
            field={`${index}.concentration`}
            value={spell.concentration}
            placeholder="Concentração"
            label="Concentração"
            isEditMode={isEditMode}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <EditableField
            characterId={characterId}
            currentCharacterData={character}
            section="spells"
            field={`${index}.prepTime`}
            value={spell.prepTime}
            placeholder="Preparo"
            label="Preparo"
            isEditMode={isEditMode}
          />
        </div>
        <div>
          <EditableField
            characterId={characterId}
            currentCharacterData={character}
            section="spells"
            field={`${index}.resistance`}
            value={spell.resistance}
            placeholder="Resistência"
            label="Resistência"
            isEditMode={isEditMode}
          />
        </div>
      </div>

      <div>
        <EditableField
          characterId={characterId}
          currentCharacterData={character}
          section="spells"
          field={`${index}.range`}
          value={spell.range}
          placeholder="Alcance"
          label="Alcance"
          isEditMode={isEditMode}
        />
      </div>

      <div className="grid grid-cols-1 gap-2">
        <EditableScalingField
          characterId={characterId}
          currentCharacterData={character}
          section="spells"
          field={`${index}.damage`}
          scalingData={spell.damage || { base: 0, perLevel: null }}
          spellLevel={spell.level || 0}
          characterLevel={character.level || 0}
          label="Dano"
          type="damage"
          isEditMode={isEditMode}
        />
        <EditableScalingField
          characterId={characterId}
          currentCharacterData={character}
          section="spells"
          field={`${index}.duration`}
          scalingData={spell.duration || { base: '', perLevel: null }}
          spellLevel={spell.level || 0}
          characterLevel={character.level || 0}
          label="Duração"
          type="duration"
          isEditMode={isEditMode}
        />
      </div>

      <div>
        <EditableTextArea
          characterId={characterId}
          currentCharacterData={character}
          section="spells"
          field={`${index}.description`}
          value={spell.description}
          placeholder="Descrição da magia"
          label="Descrição"
          rows={2}
          isEditMode={isEditMode}
        />
      </div>
    </>
  )
}
