// components/character/spells-talents/talents-card.tsx
// Lista de talentos (DS-06): mesma estrutura das magias, mantendo "usado hoje", "Novo dia"
// e o uso limitado. Devolve um fragmento para fluir no layout em colunas da aba.

import { useState } from 'react'
import { Plus, RotateCcw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  countGroupedEntries,
  firstLine,
  groupEntriesByLevel,
  listLevels,
  magicCountNoun,
  magicResultLabel,
  removeIndexFromSet,
  resolveLevelFilter,
  type LevelFilter,
} from '@/lib/spells-talents'
import type { CharacterTabProps, UpdateCharacterMutation } from '../types'
import type { Talent } from '@/lib/schemas/character'
import {
  MagicEmptyState,
  MagicEntryActions,
  MagicEntryRow,
  MagicLevelGroup,
  MagicListToolbar,
  MagicOncePerDayBadge,
} from './magic-list'
import { TalentDetails, TalentEditFields } from './talent-body'

interface TalentsCardProps extends Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'> {
  updateCharacterMutation: UpdateCharacterMutation
}

export function TalentsCard({ character, characterId, isEditMode, updateCharacterMutation }: TalentsCardProps) {
  // Busca, filtro e linhas abertas só existem na tela: nunca são gravados
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<LevelFilter>('todos')
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [editing, setEditing] = useState<Set<number>>(new Set())

  const talents: Talent[] = Array.isArray(character.talents) ? character.talents : []
  const isPending = updateCharacterMutation.isPending

  const levels = listLevels(talents)
  const activeLevel = resolveLevelFilter(level, levels)
  const groups = groupEntriesByLevel(talents, {
    level: activeLevel,
    query,
    searchFields: t => [t?.name, t?.description],
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

  // Toggle usedToday para um talento específico
  const toggleTalentUsed = async (index: number, currentValue: boolean) => {
    try {
      const updatedTalents = talents.map((t: Talent, i: number) =>
        i === index ? { ...t, usedToday: !currentValue } : t
      )
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: { talents: updatedTalents }
      })
    } catch (error) {
      console.error('Erro ao atualizar uso do talento:', error)
    }
  }

  // Resetar todos os talentos usedToday para false
  const resetAllTalentsUsage = async () => {
    try {
      const updatedTalents = talents.map((t: Talent) => ({
        ...t,
        usedToday: false
      }))
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: { talents: updatedTalents }
      })
    } catch (error) {
      console.error('Erro ao resetar talentos:', error)
    }
  }

  // Uso limitado (1x por dia) de um talento
  const handleOncePerDayChange = async (index: number, checked: boolean) => {
    if (!isEditMode) return
    try {
      const updatedTalents = talents.map((t: Talent, i: number) =>
        i === index ? { ...t, oncePerDay: checked, usedToday: checked ? t.usedToday : false } : t
      )
      // usedToday pode ficar indefinido (como antes); o JSON da gravação descarta a chave
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: { talents: updatedTalents as typeof talents }
      })
    } catch (error) {
      console.error('Erro ao atualizar talento:', error)
    }
  }

  const handleAddTalent = async () => {
    try {
      const newTalent = {
        name: '',
        level: 0,
        description: '',
        oncePerDay: false,
        usedToday: false
      }
      const updatedTalents = [...talents, newTalent]
      const updateData = { talents: updatedTalents }
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: updateData
      })
      // Conveniência de tela: limpa os filtros e abre o novo talento já em edição
      const newIndex = talents.length
      setQuery('')
      setLevel('todos')
      setExpanded(prev => new Set(prev).add(newIndex))
      setEditing(prev => new Set(prev).add(newIndex))
    } catch (error) {
      console.error('Erro ao adicionar talento:', error)
    }
  }

  const handleDeleteTalent = async (index: number) => {
    try {
      const updatedTalents = talents.filter((_: Talent, i: number) => i !== index)
      const updateData = { talents: updatedTalents }
      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: updateData
      })
      // Os índices depois do excluído descem uma posição: as linhas abertas seguem os mesmos talentos
      setExpanded(prev => removeIndexFromSet(prev, index))
      setEditing(prev => removeIndexFromSet(prev, index))
    } catch (error) {
      console.error('Erro ao remover talento:', error)
    }
  }

  // Verificar se há talentos com oncePerDay que foram usados
  const hasUsedTalents = talents.some((t: Talent) => t?.oncePerDay && t?.usedToday)

  return (
    <>
      <MagicListToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Buscar talento ou efeito"
        levels={levels}
        activeLevel={activeLevel}
        onLevelChange={setLevel}
        countLabel={magicResultLabel('talentos', shown, talents.length)}
        actions={
          <>
            {hasUsedTalents && (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={resetAllTalentsUsage}
                title="Resetar usos diários"
                className="h-[46px] gap-1.5 px-3"
              >
                <RotateCcw aria-hidden="true" className="size-4" />
                Novo dia
              </Button>
            )}
            {isEditMode && (
              <Button
                type="button"
                aria-label="Novo talento"
                disabled={isPending}
                onClick={handleAddTalent}
                className="size-[46px] shrink-0"
              >
                <Plus aria-hidden="true" className="size-5" />
              </Button>
            )}
          </>
        }
      />

      {talents.length === 0 ? (
        <MagicEmptyState
          title="Nenhum talento cadastrado"
          hint="Os talentos aparecerão aqui conforme forem adicionados"
        />
      ) : shown === 0 ? (
        <MagicEmptyState title="Nada encontrado com esse filtro." />
      ) : (
        groups.map(group => (
          <MagicLevelGroup
            key={group.level}
            level={group.level}
            tone="primary"
            countLabel={magicCountNoun('talentos', group.entries.length)}
          >
            {group.entries.map(({ item: talent, index }) => (
              <MagicEntryRow
                key={index}
                name={talent.name || 'Novo Talento'}
                sub={firstLine(talent.description)}
                isOpen={expanded.has(index)}
                onToggle={() => toggleExpanded(index)}
                muted={Boolean(talent.oncePerDay && talent.usedToday)}
                badges={talent.oncePerDay ? <MagicOncePerDayBadge /> : undefined}
                leading={
                  talent.oncePerDay ? (
                    <label className="grid size-11 shrink-0 cursor-pointer place-items-center">
                      <Checkbox
                        aria-label="Usado hoje"
                        checked={talent.usedToday || false}
                        onCheckedChange={() => toggleTalentUsed(index, talent.usedToday || false)}
                        disabled={isPending}
                        title={talent.usedToday ? 'Marcar como disponível' : 'Marcar como usado'}
                      />
                    </label>
                  ) : undefined
                }
              >
                {isEditMode && editing.has(index) ? (
                  <>
                    <TalentEditFields
                      talent={talent}
                      index={index}
                      character={character}
                      characterId={characterId}
                      isEditMode={isEditMode}
                      isPending={isPending}
                      onOncePerDayChange={checked => handleOncePerDayChange(index, checked)}
                    />
                    <MagicEntryActions
                      mode="edit"
                      onDone={() =>
                        setEditing(prev => {
                          const next = new Set(prev)
                          next.delete(index)
                          return next
                        })
                      }
                      onDelete={() => handleDeleteTalent(index)}
                      deleteDisabled={isPending}
                    />
                  </>
                ) : (
                  <>
                    <TalentDetails talent={talent} />
                    {isEditMode && (
                      <MagicEntryActions
                        mode="view"
                        onEdit={() => setEditing(prev => new Set(prev).add(index))}
                        onDelete={() => handleDeleteTalent(index)}
                        deleteDisabled={isPending}
                      />
                    )}
                  </>
                )}
              </MagicEntryRow>
            ))}
          </MagicLevelGroup>
        ))
      )}
    </>
  )
}
