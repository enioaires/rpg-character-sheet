// components/character/spells-talents/spells-card.tsx
// Lista de magias (DS-06): busca, chips de nível, cards por nível e linhas recolhíveis.
// Devolve um fragmento: a barra ocupa todas as colunas e os cards fluem no layout da aba.

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  countGroupedEntries,
  groupEntriesByLevel,
  listLevels,
  magicCountNoun,
  magicResultLabel,
  removeIndexFromSet,
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
import { SpellDetails, SpellEditFields, getSpellScaledValues } from './spell-body'

interface SpellsCardProps extends Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'> {
  updateCharacterMutation: UpdateCharacterMutation
}

export function SpellsCard({ character, characterId, isEditMode, updateCharacterMutation }: SpellsCardProps) {
  // Busca, filtro e linhas abertas só existem na tela: nunca são gravados
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<LevelFilter>('todos')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [editing, setEditing] = useState<Set<number>>(new Set())

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
      // Conveniência de tela: limpa os filtros e abre a nova magia já em edição
      const newIndex = spells.length
      setQuery('')
      setLevel('todos')
      setExpanded(prev => new Set(prev).add(newIndex))
      setEditing(prev => new Set(prev).add(newIndex))
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
      // Os índices depois do excluído descem uma posição: as linhas abertas seguem as mesmas magias
      setExpanded(prev => removeIndexFromSet(prev, index))
      setEditing(prev => removeIndexFromSet(prev, index))
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
              const damage = getSpellScaledValues(spell, character.level || 0).damage
              return (
                <MagicEntryRow
                  key={index}
                  name={spell.name || 'Nova Magia'}
                  sub={spellSubLine(spell, damage.total)}
                  isOpen={expanded.has(index)}
                  onToggle={() => toggleExpanded(index)}
                  badges={<MagicCostBadge cost={spell.berkanaCost || 0} />}
                >
                  {isEditMode && editing.has(index) ? (
                    <>
                      <SpellEditFields
                        spell={spell}
                        index={index}
                        character={character}
                        characterId={characterId}
                        isEditMode={isEditMode}
                      />
                      <MagicEntryActions
                        mode="edit"
                        onDone={() => setEditing(prev => {
                          const next = new Set(prev)
                          next.delete(index)
                          return next
                        })}
                        onDelete={() => handleDeleteSpell(index)}
                        deleteDisabled={updateCharacterMutation.isPending}
                      />
                    </>
                  ) : (
                    <>
                      <SpellDetails spell={spell} characterLevel={character.level || 0} />
                      {isEditMode && (
                        <MagicEntryActions
                          mode="view"
                          onEdit={() => setEditing(prev => new Set(prev).add(index))}
                          onDelete={() => handleDeleteSpell(index)}
                          deleteDisabled={updateCharacterMutation.isPending}
                        />
                      )}
                    </>
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
