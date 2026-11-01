// components/character/basic-info/berkana-card.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EditableNumberField } from '@/components/ui/editable-field'
import { calculateMaxBerkana, getBaseBerkana } from '@/lib/calculations'

import type { CharacterTabProps, UpdateCharacterMutation } from '../types'

interface BerkanaCardProps extends Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'> {
  updateCharacterMutation: UpdateCharacterMutation
}

export function BerkanaCard({ character, characterId, isEditMode, updateCharacterMutation }: BerkanaCardProps) {
  const {
    level,
    maxBerkana = 100,
    currentBerkana = 100,
    berkanaBonus = 0,
  } = character

  return (
    <Card data-section="berkana">
      <CardHeader>
        <CardTitle>Berkana</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {(() => {
          const calculatedMax = calculateMaxBerkana(level || 0, getBaseBerkana(), berkanaBonus || 0)
          const actualMaxBerkana = maxBerkana || calculatedMax

          const handleBerkanaQuickEdit = async (action: 'fill' | 'minus30' | 'minus50') => {
            let newValue = currentBerkana || 0

            switch (action) {
              case 'fill':
                newValue = actualMaxBerkana
                break
              case 'minus30':
                newValue = Math.max(0, newValue - 30)
                break
              case 'minus50':
                newValue = Math.max(0, newValue - 50)
                break
            }

            // Usar a mesma lógica do EditableField para salvar
            try {
              const updateData = {
                currentBerkana: newValue
              }
              await updateCharacterMutation.mutateAsync({
                id: characterId,
                data: updateData
              })
            } catch (error) {
              console.error('Erro ao atualizar Berkana:', error)
            }
          }

          return (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Atual</label>
                  <EditableNumberField
                    characterId={characterId}
                    currentCharacterData={character}
                    section="berkana"
                    field="current"
                    value={currentBerkana}
                    max={actualMaxBerkana}
                    className="text-lg font-bold"
                    isEditMode={isEditMode}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Máxima</label>
                  <EditableNumberField
                    characterId={characterId}
                    currentCharacterData={character}
                    section="berkana"
                    field="max"
                    value={actualMaxBerkana}
                    className="text-lg font-bold text-primary"
                    isEditMode={isEditMode}
                  />
                </div>
              </div>

              {/* Botões de Edição Rápida */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBerkanaQuickEdit('fill')}
                  disabled={!isEditMode || updateCharacterMutation.isPending}
                  className="flex-1"
                >
                  Berkana Máxima
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBerkanaQuickEdit('minus30')}
                  disabled={!isEditMode || updateCharacterMutation.isPending}
                  className="flex-1"
                >
                  -30
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBerkanaQuickEdit('minus50')}
                  disabled={!isEditMode || updateCharacterMutation.isPending}
                  className="flex-1"
                >
                  -50
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium">Bônus</label>
                <EditableNumberField
                  characterId={characterId}
                  currentCharacterData={character}
                  section="berkana"
                  field="bonus"
                  value={berkanaBonus}
                  isEditMode={isEditMode}
                />
              </div>
            </>
          )
        })()}
      </CardContent>
    </Card>
  )
}
