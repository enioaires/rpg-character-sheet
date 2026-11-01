// components/character/skills-kit-tab.tsx
// Aba Perícias e Kit: devolve os cards como fragmento (filhos diretos do fluxo em colunas do layout).
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EditableField, EditableNumberField } from '@/components/ui/editable-field'
import { useUpdateCharacter } from '@/lib/api/queries'
import { UndoIcon } from 'lucide-react'
import { DEFAULT_ADVENTURE_KIT } from '@/lib/constants/character'

import { CharacterTabProps } from './types'
import type { AdventureKitItem } from '@/lib/schemas/character'
import { SkillsCard } from './skills-kit/skills-card'

type SkillsKitTabProps = CharacterTabProps

export function SkillsKitTab({
  character,
  characterId,
  isEditMode,
  setIsSkillsModalOpen,
}: SkillsKitTabProps) {
  const updateCharacterMutation = useUpdateCharacter()

  const { adventureKit = [], finances = {} } = character

  return (
    <>
      <SkillsCard
        character={character}
        characterId={characterId}
        isEditMode={isEditMode}
        updateCharacterMutation={updateCharacterMutation}
        onOpenSkillsOverview={
          setIsSkillsModalOpen ? () => setIsSkillsModalOpen(true) : undefined
        }
      />

    {/* Finanças */}
    <Card data-section="finances">
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
              isEditMode={isEditMode}
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
              isEditMode={isEditMode}
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
              isEditMode={isEditMode}
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
              isEditMode={isEditMode}
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
              isEditMode={isEditMode}
            />
          </div>
        </div>
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
              disabled={!isEditMode}
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
              disabled={!isEditMode}
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
              adventureKit.map((item: AdventureKitItem, index: number) => (
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
                          isEditMode={isEditMode}
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
                      isEditMode={isEditMode}
                    />

                    {!item.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={!isEditMode}
                        onClick={async () => {
                          try {
                            const updatedKit = adventureKit.filter((_: AdventureKitItem, i: number) => i !== index)
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
    </>
  )
}
