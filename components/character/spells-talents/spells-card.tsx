// components/character/spells-talents/spells-card.tsx
// Lista de magias (DS-06): busca, chips de nível, cards por nível e linhas recolhíveis.
// Devolve um fragmento: a barra ocupa todas as colunas e os cards fluem no layout da aba.

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EditableField, EditableTextArea, EditableNumberField } from '@/components/ui/editable-field'
import {
  EditableScalingField,
  calculateScaledValue,
  normalizeScalingData,
} from '@/components/ui/editable-scaling-field'
import {
  countGroupedEntries,
  groupEntriesByLevel,
  listLevels,
  magicCountNoun,
  magicResultLabel,
  resolveLevelFilter,
  spellSubLine,
  type LevelFilter,
} from '@/lib/spells-talents'
import type { CharacterTabProps, UpdateCharacterMutation } from '../types'
import type { Spell } from '@/lib/schemas/character'
import {
  MagicCostBadge,
  MagicEmptyState,
  MagicEntryActions,
  MagicEntryRow,
  MagicLevelGroup,
  MagicListToolbar,
} from './magic-list'

interface SpellsCardProps extends Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'> {
  updateCharacterMutation: UpdateCharacterMutation
}

export function SpellsCard({ character, characterId, isEditMode, updateCharacterMutation }: SpellsCardProps) {
  // Busca, filtro e linhas abertas só existem na tela: nunca são gravados
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<LevelFilter>('todos')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const spells: Spell[] = Array.isArray(character.spells) ? character.spells : []

  const levels = listLevels(spells)
  const activeLevel = resolveLevelFilter(level, levels)
  const groups = groupEntriesByLevel(spells, {
    level: activeLevel,
    query,
    searchFields: s => [s?.name, s?.type, s?.description],
  })
  const shown = countGroupedEntries(groups)

  const toggleExpanded = (index: number) => {
    const next = new Set(expanded)
    if (next.has(index)) {
      next.delete(index)
    } else {
      next.add(index)
    }
    setExpanded(next)
  }

  const handleAddSpell = async () => {
    try {
      const newSpell = {
        name: '',
        level: 0,
        berkanaCost: 0,
        type: '',
        concentration: '',
        duration: { base: '', perLevel: null },
        prepTime: '',
        resistance: '',
        range: '',
        damage: { base: 0, perLevel: null },
        description: ''
      }
      const updatedSpells = [...spells, newSpell]
      const updateData = { spells: updatedSpells }
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: updateData
      })
    } catch (error) {
      console.error('Erro ao adicionar magia:', error)
    }
  }

  const handleDeleteSpell = async (index: number) => {
    try {
      const updatedSpells = spells.filter((_: Spell, i: number) => i !== index)
      const updateData = { spells: updatedSpells }
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: updateData
      })
    } catch (error) {
      console.error('Erro ao remover magia:', error)
    }
  }

  return (
    <>
      <MagicListToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar magia, tipo ou efeito"
        levels={levels}
        activeLevel={activeLevel}
        onLevelChange={setLevel}
        countLabel={magicResultLabel('magias', shown, spells.length)}
        actions={
          isEditMode && (
            <Button
              type="button"
              aria-label="Nova magia"
              disabled={updateCharacterMutation.isPending}
              onClick={handleAddSpell}
              className="size-[46px] shrink-0"
            >
              <Plus aria-hidden="true" className="size-5" />
            </Button>
          )
        }
      />

      {spells.length === 0 ? (
        <MagicEmptyState
          title="Nenhuma magia ou habilidade cadastrada"
          hint="As magias aparecerão aqui conforme forem adicionadas"
        />
      ) : shown === 0 ? (
        <MagicEmptyState title="Nada encontrado com esse filtro." />
      ) : (
        groups.map(group => (
          <MagicLevelGroup
            key={group.level}
            level={group.level}
            tone="berkana"
            countLabel={magicCountNoun('magias', group.entries.length)}
          >
            {group.entries.map(({ item: spell, index }) => {
              const normalized = normalizeScalingData(spell.damage || { base: 0, perLevel: null }, 'damage')
              const damage = calculateScaledValue(
                normalized.base,
                normalized.perLevel,
                spell.level || 0,
                character.level || 0
              )
              return (
                <MagicEntryRow
                  key={index}
                  name={spell.name || 'Nova Magia'}
                  sub={spellSubLine(spell, damage.total)}
                  isOpen={expanded.has(index)}
                  onToggle={() => toggleExpanded(index)}
                  badges={<MagicCostBadge cost={spell.berkanaCost || 0} />}
                >
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

                  {isEditMode && (
                    <MagicEntryActions
                      mode="view"
                      onDelete={() => handleDeleteSpell(index)}
                      deleteDisabled={updateCharacterMutation.isPending}
                    />
                  )}
                </MagicEntryRow>
              )
            })}
          </MagicLevelGroup>
        ))
      )}
    </>
  )
}
