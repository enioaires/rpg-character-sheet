// components/character/SkillsKitTab.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EditableField, EditableNumberField } from '@/components/ui/editable-field'
import { useUpdateCharacter } from '@/lib/api/queries'
import { ChevronDown, ChevronUp, UndoIcon } from 'lucide-react'
import {
  SKILLS,
  SKILL_LABELS,
  DEFAULT_ADVENTURE_KIT,
  calculateSkillBonus,
  calculateSkillPointsAvailable
} from '@/lib/constants/character'

interface SkillsKitTabProps {
  character: any
  characterId: string
}

export function SkillsKitTab({ character, characterId }: SkillsKitTabProps) {
  const updateCharacterMutation = useUpdateCharacter()
  const [isSkillDistributionExpanded, setIsSkillDistributionExpanded] = useState(false)

  const {
    level,
    skills = {},
    adventureKit = [],
    finances = {},
  } = character

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Perícias - Resumo */}
        <Card>
          <CardHeader>
            <CardTitle>Perícias - Resumo</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-0.5 text-sm pr-4">
                {SKILLS.map((skillKey, index) => {
                  const skill = skills[skillKey] || { distributed: 0, bonus: 0 }
                  const levelBonus = calculateSkillBonus(level || 0)
                  const total = 1 + (skill.distributed || 0) + (skill.bonus || 0) + levelBonus

                  return (
                    <div
                      key={skillKey}
                      className={`flex items-center py-1.5 px-2 rounded-sm transition-colors hover:bg-muted/50 ${index % 2 === 0 ? 'bg-muted/20' : 'bg-transparent'
                        }`}
                    >
                      {/* Nome da Perícia */}
                      <span className="flex-1 text-left">
                        {SKILL_LABELS[skillKey]}
                      </span>

                      {/* Linha Pontilhada */}
                      <div className="flex-1 mx-3 border-b border-dotted border-muted-foreground/30"></div>

                      {/* Valor Total */}
                      <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded min-w-[2rem] text-center">
                        {total}
                      </span>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Kit de Aventureiro */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Kit de Aventureiro</CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const updateData = {
                        adventureKit: DEFAULT_ADVENTURE_KIT
                      }
                      await updateCharacterMutation.mutateAsync({
                        id: characterId,
                        data: updateData
                      })
                    } catch (error) {
                      console.error('Erro ao resetar kit:', error)
                    }
                  }}
                >
                  <UndoIcon className="size-4" /> Reset
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const newItem = { name: '', quantity: 1, isDefault: false }
                      const updatedKit = [...(adventureKit || []), newItem]
                      const updateData = {
                        adventureKit: updatedKit
                      }
                      await updateCharacterMutation.mutateAsync({
                        id: characterId,
                        data: updateData
                      })
                    } catch (error) {
                      console.error('Erro ao adicionar item:', error)
                    }
                  }}
                >
                  + Adicionar Item
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2 pr-4">
                {adventureKit && adventureKit.length > 0 ? (
                  adventureKit.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                      <div className="flex-1">
                        {item.isDefault ? (
                          // Item padrão - nome não editável
                          <div>
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-muted-foreground">Item padrão</div>
                          </div>
                        ) : (
                          // Item customizado - nome editável
                          <div>
                            <EditableField
                              characterId={characterId}
                              currentCharacterData={character}
                              section="adventureKit"
                              field={`${index}.name`}
                              value={item.name}
                              placeholder="Nome do item"
                              className="font-medium"
                            />
                            <div className="text-xs text-muted-foreground">Item customizado</div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <EditableNumberField
                          characterId={characterId}
                          currentCharacterData={character}
                          section="adventureKit"
                          field={`${index}.quantity`}
                          value={item.quantity || 1}
                          className="w-16 text-center"
                          min={0}
                        />

                        {!item.isDefault && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              try {
                                const updatedKit = adventureKit.filter((_: any, i: number) => i !== index)
                                const updateData = {
                                  adventureKit: updatedKit
                                }
                                await updateCharacterMutation.mutateAsync({
                                  id: characterId,
                                  data: updateData
                                })
                              } catch (error) {
                                console.error('Erro ao remover item:', error)
                              }
                            }}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum item no kit</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Finanças */}
        <Card>
          <CardHeader>
            <CardTitle>Finanças</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ouro:</span>
                <EditableNumberField
                  characterId={characterId}
                  currentCharacterData={character}
                  section="finances"
                  field="ouro"
                  value={finances.ouro || 0}
                  className="w-20 text-right"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Prata:</span>
                <EditableNumberField
                  characterId={characterId}
                  currentCharacterData={character}
                  section="finances"
                  field="prata"
                  value={finances.prata || 0}
                  className="w-20 text-right"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Cobre:</span>
                <EditableNumberField
                  characterId={characterId}
                  currentCharacterData={character}
                  section="finances"
                  field="cobre"
                  value={finances.cobre || 0}
                  className="w-20 text-right"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Imperano:</span>
                <EditableNumberField
                  characterId={characterId}
                  currentCharacterData={character}
                  section="finances"
                  field="imperano"
                  value={finances.imperano || 0}
                  className="w-20 text-right"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Jóias:</span>
                <EditableNumberField
                  characterId={characterId}
                  currentCharacterData={character}
                  section="finances"
                  field="joias"
                  value={finances.joias || 0}
                  className="w-20 text-right"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de distribuição de pontos de perícia */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Distribuição de Pontos de Perícia</CardTitle>
              <div className="text-sm text-muted-foreground">
                {(() => {
                  const availablePoints = calculateSkillPointsAvailable(level || 0)
                  const usedPoints = SKILLS.reduce((total, skillKey) => {
                    const skill = skills[skillKey] || { distributed: 0 }
                    return total + (skill.distributed || 0)
                  }, 0)
                  const remainingPoints = availablePoints - usedPoints

                  return (
                    <div className="flex gap-4">
                      <span>Disponíveis: {availablePoints}</span>
                      <span>Usados: {usedPoints}</span>
                      <span className={remainingPoints < 0 ? 'text-destructive' : 'text-primary'}>
                        Restantes: {remainingPoints}
                      </span>
                    </div>
                  )
                })()}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSkillDistributionExpanded(!isSkillDistributionExpanded)}
              className="h-8 w-8 p-0"
            >
              {isSkillDistributionExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        {isSkillDistributionExpanded && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SKILLS.map((skillKey) => {
                const skill = skills[skillKey] || { distributed: 0, bonus: 0 }
                const levelBonus = calculateSkillBonus(level || 0)
                const total = 1 + (skill.distributed || 0) + (skill.bonus || 0) + levelBonus

                const handleQuickAdd = async (amount: number) => {
                  try {
                    const newValue = (skill.distributed || 0) + amount
                    const updateData = {
                      skills: {
                        ...skills,
                        [skillKey]: {
                          ...skill,
                          distributed: Math.max(0, newValue)
                        }
                      }
                    }
                    await updateCharacterMutation.mutateAsync({
                      id: characterId,
                      data: updateData
                    })
                  } catch (error) {
                    console.error('Erro ao adicionar pontos:', error)
                  }
                }

                return (
                  <div key={skillKey} className="space-y-2 p-3 bg-muted/50 rounded">
                    <div className="font-medium text-sm">{SKILL_LABELS[skillKey]}</div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-muted-foreground">Base:</label>
                        <div className="font-medium text-center">1</div>
                      </div>

                      <div>
                        <label className="text-muted-foreground">Distrib:</label>
                        <EditableNumberField
                          characterId={characterId}
                          currentCharacterData={character}
                          section="skills"
                          field={`${skillKey}.distributed`}
                          value={skill.distributed || 0}
                          className="w-full text-center"
                          min={0}
                        />
                      </div>

                      <div>
                        <label className="text-muted-foreground">Bônus:</label>
                        <EditableNumberField
                          characterId={characterId}
                          currentCharacterData={character}
                          section="skills"
                          field={`${skillKey}.bonus`}
                          value={skill.bonus || 0}
                          className="w-full text-center"
                        />
                      </div>

                      <div>
                        <label className="text-muted-foreground">Nível:</label>
                        <div className="font-medium text-center">{levelBonus}</div>
                      </div>
                    </div>

                    {/* Botões de Edição Rápida */}
                    <div className="flex gap-1 justify-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAdd(1)}
                        disabled={updateCharacterMutation.isPending}
                        className="h-6 px-2 text-xs"
                      >
                        +1
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAdd(2)}
                        disabled={updateCharacterMutation.isPending}
                        className="h-6 px-2 text-xs"
                      >
                        +2
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuickAdd(3)}
                        disabled={updateCharacterMutation.isPending}
                        className="h-6 px-2 text-xs"
                      >
                        +3
                      </Button>
                    </div>

                    <div className="text-center pt-1 border-t">
                      <span className="text-sm font-bold">
                        Total: {total}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}