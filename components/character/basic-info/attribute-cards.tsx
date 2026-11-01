// components/character/basic-info/attribute-cards.tsx

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EditableNumberField } from '@/components/ui/editable-field'
import { ChevronDown, ChevronUp, Maximize2 } from 'lucide-react'
import { ATTRIBUTES, ATTRIBUTE_LABELS } from '@/lib/constants/character'
import { calculateAttributeTotal, getAttributeLevelBonus, toAttributeValue } from '@/lib/calculations'

import type { CharacterTabProps } from '../types'

interface AttributesSummaryCardProps extends Pick<CharacterTabProps, 'character'> {
  setIsAttributesModalOpen?: CharacterTabProps['setIsAttributesModalOpen']
}

export function AttributesSummaryCard({ character, setIsAttributesModalOpen }: AttributesSummaryCardProps) {
  const {
    level,
    attributes = {},
  } = character

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Atributos - Resumo</CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            title="Expandir atributos"
            onClick={() => setIsAttributesModalOpen?.(true)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-0.5 text-sm">
          {ATTRIBUTES.map((attributeKey, index) => {
            const attr = attributes[attributeKey] || { race: 0, class: 0, bonus: 0 }
            const total = calculateAttributeTotal(toAttributeValue(attr), level || 0)

            return (
              <div
                key={attributeKey}
                className={`flex items-center py-1.5 px-2 rounded-sm transition-colors hover:bg-muted/50 ${index % 2 === 0 ? 'bg-muted/20' : 'bg-transparent'
                  }`}
              >
                {/* Nome do Atributo */}
                <span className="flex-1 text-left">
                  {ATTRIBUTE_LABELS[attributeKey]}
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
      </CardContent>
    </Card>
  )
}

type AttributesDistributionCardProps = Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'>

export function AttributesDistributionCard({ character, characterId, isEditMode }: AttributesDistributionCardProps) {
  const [isAttributesExpanded, setIsAttributesExpanded] = useState(false)

  const {
    level,
    attributes = {},
  } = character

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Distribuição de Atributos</CardTitle>
            <div className="text-sm text-muted-foreground">
              Edite os valores de raça, classe e bônus
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAttributesExpanded(!isAttributesExpanded)}
            className="h-8 w-8 p-0"
          >
            {isAttributesExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isAttributesExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ATTRIBUTES.map((attributeKey) => {
              const attr = attributes[attributeKey] || { race: 0, class: 0, bonus: 0 }
              const levelBonus = getAttributeLevelBonus(level || 0)
              const total = calculateAttributeTotal(toAttributeValue(attr), level || 0)

              return (
                <div key={attributeKey} className="space-y-2 p-3 bg-muted/50 rounded">
                  <div className="text-center">
                    <label className="text-sm font-medium">{ATTRIBUTE_LABELS[attributeKey]}</label>
                    <div className="text-2xl font-bold text-primary">{total}</div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 sm:gap-2 text-xs">
                    <div>
                      <label className="text-muted-foreground">Raça</label>
                      <EditableNumberField
                        characterId={characterId}
                        currentCharacterData={character}
                        section="attributes"
                        field={`${attributeKey}.race`}
                        value={attr.race || 0}
                        className="text-center text-xs"
                        isEditMode={isEditMode}
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground">Classe</label>
                      <EditableNumberField
                        characterId={characterId}
                        currentCharacterData={character}
                        section="attributes"
                        field={`${attributeKey}.class`}
                        value={attr.class || 0}
                        className="text-center text-xs"
                        isEditMode={isEditMode}
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground">Bônus</label>
                      <EditableNumberField
                        characterId={characterId}
                        currentCharacterData={character}
                        section="attributes"
                        field={`${attributeKey}.bonus`}
                        value={attr.bonus || 0}
                        className="text-center text-xs"
                        isEditMode={isEditMode}
                      />
                    </div>
                  </div>

                  {levelBonus > 0 && (
                    <div className="text-xs text-center text-muted-foreground">
                      +{levelBonus} (nível)
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
