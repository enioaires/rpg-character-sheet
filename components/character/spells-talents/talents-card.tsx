// components/character/spells-talents/talents-card.tsx

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { EditableField, EditableTextArea, EditableNumberField } from '@/components/ui/editable-field'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronRight, Zap, RotateCcw } from 'lucide-react'

import type { CharacterTabProps, UpdateCharacterMutation } from '../types'
import type { Talent } from '@/lib/schemas/character'

interface TalentsCardProps extends Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'> {
  updateCharacterMutation: UpdateCharacterMutation
}

export function TalentsCard({ character, characterId, isEditMode, updateCharacterMutation }: TalentsCardProps) {
  const [expandedTalents, setExpandedTalents] = useState<Set<number>>(new Set())

  const {
    talents = [],
  } = character

  const toggleTalentExpanded = (index: number) => {
    const newExpanded = new Set(expandedTalents)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedTalents(newExpanded)
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

  // Verificar se há talentos com oncePerDay que foram usados
  const hasUsedTalents = talents.some((t: Talent) => t.oncePerDay && t.usedToday)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Talentos</CardTitle>
          <div className="flex items-center gap-2">
            {hasUsedTalents && (
              <Button
                size="sm"
                variant="outline"
                disabled={updateCharacterMutation.isPending}
                onClick={resetAllTalentsUsage}
                title="Resetar usos diários"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Novo Dia
              </Button>
            )}
            <Button
              size="sm"
              disabled={!isEditMode || updateCharacterMutation.isPending}
              onClick={async () => {
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
              } catch (error) {
                console.error('Erro ao adicionar talento:', error)
              }
            }}
          >
            + Adicionar Talento
          </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[70vh] md:h-96">
          <div className="space-y-2">
            {talents && talents.length > 0 ? (
              talents.map((talent: Talent, index: number) => {
                const isExpanded = expandedTalents.has(index)
                return (
                  <Collapsible key={index} open={isExpanded} onOpenChange={() => toggleTalentExpanded(index)}>
                    <div className="border rounded-lg bg-muted/30">
                      {/* Header Compacto */}
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <Zap className={`w-4 h-4 ${talent.oncePerDay && talent.usedToday ? 'text-muted-foreground' : 'text-orange-500'}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium truncate ${talent.oncePerDay && talent.usedToday ? 'text-muted-foreground line-through' : ''}`}>
                              {talent.name || 'Novo Talento'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Nível {talent.level || 0}{talent.oncePerDay ? ' • 1x/dia' : ''}
                            </div>
                          </div>
                          {talent.oncePerDay && (
                            <Checkbox
                              checked={talent.usedToday || false}
                              onCheckedChange={() => toggleTalentUsed(index, talent.usedToday || false)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={updateCharacterMutation.isPending}
                              className="mr-2"
                              title={talent.usedToday ? 'Marcar como disponível' : 'Marcar como usado'}
                            />
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async (e) => {
                              e.stopPropagation()
                              try {
                                const updatedTalents = talents.filter((_: Talent, i: number) => i !== index)
                                const updateData = { talents: updatedTalents }
                                await updateCharacterMutation.mutateAsync({
                                  id: characterId,
                                  data: updateData
                                })
                              } catch (error) {
                                console.error('Erro ao remover talento:', error)
                              }
                            }}
                            disabled={!isEditMode || updateCharacterMutation.isPending}
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                          >
                            ×
                          </Button>
                        </div>
                      </CollapsibleTrigger>

                      {/* Conteúdo Expandido */}
                      <CollapsibleContent>
                        <div className="p-3 pt-0 space-y-3 border-t">
                          {/* Nome e Nível */}
                          <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                              <EditableField
                                characterId={characterId}
                                currentCharacterData={character}
                                section="talents"
                                field={`${index}.name`}
                                value={talent.name}
                                placeholder="Nome do talento"
                                label="Nome"
                                isEditMode={isEditMode}
                              />
                            </div>
                            <div>
                              <EditableNumberField
                                characterId={characterId}
                                currentCharacterData={character}
                                section="talents"
                                field={`${index}.level`}
                                value={talent.level || 0}
                                label="Nível"
                                className="text-center"
                                isEditMode={isEditMode}
                              />
                            </div>
                          </div>

                          {/* 1x por dia */}
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`talent-${index}-oncePerDay`}
                              checked={talent.oncePerDay || false}
                              onCheckedChange={async (checked) => {
                                if (!isEditMode) return
                                try {
                                  const updatedTalents = talents.map((t: Talent, i: number) =>
                                    i === index ? { ...t, oncePerDay: checked, usedToday: checked ? t.usedToday : false } : t
                                  )
                                  await updateCharacterMutation.mutateAsync({
                                    id: characterId,
                                    data: { talents: updatedTalents }
                                  })
                                } catch (error) {
                                  console.error('Erro ao atualizar talento:', error)
                                }
                              }}
                              disabled={!isEditMode || updateCharacterMutation.isPending}
                            />
                            <label
                              htmlFor={`talent-${index}-oncePerDay`}
                              className="text-sm text-muted-foreground cursor-pointer"
                            >
                              Uso limitado (1x por dia)
                            </label>
                          </div>

                          {/* Descrição */}
                          <div>
                            <EditableTextArea
                              characterId={characterId}
                              currentCharacterData={character}
                              section="talents"
                              field={`${index}.description`}
                              value={talent.description}
                              placeholder="Descrição do talento"
                              label="Descrição"
                              rows={2}
                              isEditMode={isEditMode}
                            />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>Nenhum talento cadastrado</p>
                <p className="text-xs mt-1">Os talentos aparecerão aqui conforme forem adicionados</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
