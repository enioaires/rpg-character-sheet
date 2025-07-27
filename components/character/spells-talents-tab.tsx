// components/character/SpellsTalentsTab.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EditableField, EditableTextArea, EditableNumberField } from '@/components/ui/editable-field'
import { useUpdateCharacter } from '@/lib/api/queries'

interface SpellsTalentsTabProps {
  character: any
  characterId: string
  isEditMode: boolean
}

export function SpellsTalentsTab({ character, characterId, isEditMode }: SpellsTalentsTabProps) {
  const updateCharacterMutation = useUpdateCharacter()
  
  const {
    spells = [],
    talents = [],
  } = character

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Magias */}
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
                      duration: '',
                      prepTime: '',
                      resistance: '',
                      range: '',
                      damage: '',
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
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {spells && spells.length > 0 ? (
                  spells.map((spell: any, index: number) => (
                    <div key={index} className="p-4 bg-muted rounded space-y-3">
                      {/* Nome, Nível e Botão de Remover */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <EditableField
                            characterId={characterId}
                            currentCharacterData={character}
                            section="spells"
                            field={`${index}.name`}
                            value={spell.name}
                            placeholder="Nome da magia"
                            className="font-medium"
                            isEditMode={isEditMode}
                          />
                        </div>
                        <div className="w-20">
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            try {
                              const updatedSpells = spells.filter((_: any, i: number) => i !== index)
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
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          ×
                        </Button>
                      </div>

                      {/* Custo, Tipo e Concentração */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <EditableNumberField
                            characterId={characterId}
                            currentCharacterData={character}
                            section="spells"
                            field={`${index}.berkanaCost`}
                            value={spell.berkanaCost || 0}
                            label="Custo Berkana"
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
                            placeholder="Tipo/Domínio"
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

                      {/* Duração, Tempo de Preparo e Resistência */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <EditableField
                            characterId={characterId}
                            currentCharacterData={character}
                            section="spells"
                            field={`${index}.duration`}
                            value={spell.duration}
                            placeholder="Duração"
                            label="Duração"
                            isEditMode={isEditMode}
                          />
                        </div>
                        <div>
                          <EditableField
                            characterId={characterId}
                            currentCharacterData={character}
                            section="spells"
                            field={`${index}.prepTime`}
                            value={spell.prepTime}
                            placeholder="Tempo de Preparo"
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

                      {/* Alcance e Dano */}
                      <div className="grid grid-cols-2 gap-3">
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
                        <div>
                          <EditableField
                            characterId={characterId}
                            currentCharacterData={character}
                            section="spells"
                            field={`${index}.damage`}
                            value={spell.damage}
                            placeholder="Dano"
                            label="Dano"
                            isEditMode={isEditMode}
                          />
                        </div>
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
                          rows={3}
                          isEditMode={isEditMode}
                        />
                      </div>
                    </div>
                  ))
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

        {/* Talentos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Talentos</CardTitle>
              <Button
                size="sm"
                disabled={!isEditMode || updateCharacterMutation.isPending}
                onClick={async () => {
                  try {
                    const newTalent = {
                      name: '',
                      level: 0,
                      description: ''
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
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {talents && talents.length > 0 ? (
                  talents.map((talent: any, index: number) => (
                    <div key={index} className="p-4 bg-muted rounded space-y-3">
                      {/* Nome, Nível e Botão de Remover */}
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <EditableField
                            characterId={characterId}
                            currentCharacterData={character}
                            section="talents"
                            field={`${index}.name`}
                            value={talent.name}
                            placeholder="Nome do talento"
                            label="Nome"
                            className="font-medium"
                            isEditMode={isEditMode}
                          />
                        </div>
                        <div className="w-20">
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
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async () => {
                            try {
                              const updatedTalents = talents.filter((_: any, i: number) => i !== index)
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
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          ×
                        </Button>
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
                          rows={3}
                          isEditMode={isEditMode}
                        />
                      </div>
                    </div>
                  ))
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
      </div>


    </div>
  )
}