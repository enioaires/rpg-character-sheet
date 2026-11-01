// components/character/spells-talents/spells-card.tsx

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { EditableField, EditableTextArea, EditableNumberField } from '@/components/ui/editable-field'
import { EditableScalingField } from '@/components/ui/editable-scaling-field'
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react'

import type { CharacterTabProps, UpdateCharacterMutation } from '../types'
import type { Spell } from '@/lib/schemas/character'

interface SpellsCardProps extends Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'> {
  updateCharacterMutation: UpdateCharacterMutation
}

export function SpellsCard({ character, characterId, isEditMode, updateCharacterMutation }: SpellsCardProps) {
  const [expandedSpells, setExpandedSpells] = useState<Set<number>>(new Set())

  const {
    spells = [],
  } = character

  const toggleSpellExpanded = (index: number) => {
    const newExpanded = new Set(expandedSpells)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSpells(newExpanded)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Magias e Habilidades</CardTitle>
          <Button
            size="sm"
            disabled={!isEditMode || updateCharacterMutation.isPending}
            onClick={async () => {
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
            }}
          >
            + Adicionar Magia
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[70vh] md:h-96">
          <div className="space-y-2">
            {spells && spells.length > 0 ? (
              spells.map((spell: Spell, index: number) => {
                const isExpanded = expandedSpells.has(index)
                return (
                  <Collapsible key={index} open={isExpanded} onOpenChange={() => toggleSpellExpanded(index)}>
                    <div className="border rounded-lg bg-muted/30">
                      {/* Header Compacto */}
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                          <Sparkles className="w-4 h-4 text-primary" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {spell.name || 'Nova Magia'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Nível {spell.level || 0} • Custo: {spell.berkanaCost || 0}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async (e) => {
                              e.stopPropagation()
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

                          {/* Custo, Tipo e Concentração */}
                          <div className="grid grid-cols-3 gap-2">
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

                          {/* Preparo e Resistência */}
                          <div className="grid grid-cols-2 gap-2">
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

                          {/* Alcance */}
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

                          {/* Dano e Duração com Escalonamento */}
                          <div className="grid grid-cols-2 gap-2">
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

                          {/* Descrição */}
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
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>Nenhuma magia ou habilidade cadastrada</p>
                <p className="text-xs mt-1">As magias aparecerão aqui conforme forem adicionadas</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
