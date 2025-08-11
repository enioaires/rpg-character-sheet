// components/character/BasicInfoTab.tsx
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { EditableField, EditableNumberField, EditableTextArea } from '@/components/ui/editable-field'
import { useUpdateCharacter } from '@/lib/api/queries'
import { useCharacterStore } from '@/lib/store/character'
import { ChevronDown, ChevronUp, Heart, Zap, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  ATTRIBUTES,
  ATTRIBUTE_LABELS,
  STANDARD_LANGUAGES,
  VITALITY_LEVELS,
  VITALITY_LABELS,
  calculateXPForNextLevel,
  calculateAttributeBonus,
  calculateBerkana,
  calculateVitality
} from '@/lib/constants/character'

import { CharacterTabProps } from './types'

interface BasicInfoTabProps extends CharacterTabProps {}

export function BasicInfoTab({ 
  character, 
  characterId, 
  isEditMode, 
  isAttributesModalOpen = false, 
  setIsAttributesModalOpen 
}: BasicInfoTabProps) {
  const updateCharacterMutation = useUpdateCharacter()
  const [isAttributesExpanded, setIsAttributesExpanded] = useState(false)
  const [damageValue, setDamageValue] = useState('')

  const {
    playerName, characterName, class: charClass, race, deity,
    homeland, alignment, gender, age, weight, height, virtuePoints,
    level, currentXP,
    attributes = {},
    vitality = {},
    currentVitality = {},
    maxBerkana = 100,
    currentBerkana = 100,
    berkanaBonus = 0,
    weapons = {},
    armor = {},
    languages = {},
  } = character

  // Funções para sistema de dano/cura da vitalidade
  const applyDamage = async (damageAmount: number) => {
    if (!damageAmount || damageAmount <= 0) {
      toast.error('Digite um valor de dano válido')
      return
    }

    try {
      const calculatedVitality = calculateVitality(
        vitality.race || 0,
        vitality.class || 0,
        level || 0
      )

      // Criar cópia dos valores atuais de vitalidade
      let newCurrentVitality = { ...currentVitality }
      let remainingDamage = damageAmount

      // Inicializar currentVitality com valores máximos se ainda não foi definido
      for (const vitalityKey of VITALITY_LEVELS) {
        if (newCurrentVitality[vitalityKey] === undefined || newCurrentVitality[vitalityKey] === null) {
          newCurrentVitality[vitalityKey] = calculatedVitality[vitalityKey]
        }
      }

      // Aplicar dano de cima para baixo (do maior para o menor)
      for (const vitalityKey of VITALITY_LEVELS) {
        if (remainingDamage <= 0) break

        const currentValue = newCurrentVitality[vitalityKey]
        const damageToApply = Math.min(remainingDamage, currentValue)

        newCurrentVitality[vitalityKey] = Math.max(0, currentValue - damageToApply)
        remainingDamage -= damageToApply
      }

      // Salvar no banco
      const updateData = {
        currentVitality: newCurrentVitality
      }

      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: updateData
      })

      toast.success(`${damageAmount} de dano aplicado!`)
      setDamageValue('')
    } catch (error) {
      console.error('Erro ao aplicar dano:', error)
      toast.error('Erro ao aplicar dano')
    }
  }

  const restoreFullHealth = async () => {
    try {
      const calculatedVitality = calculateVitality(
        vitality.race || 0,
        vitality.class || 0,
        level || 0
      )

      // Restaurar todos os níveis para o máximo
      const updateData = {
        currentVitality: calculatedVitality
      }

      await updateCharacterMutation.mutateAsync({
        id: characterId,
        data: updateData
      })

      toast.success('Vitalidade restaurada ao máximo!')
    } catch (error) {
      console.error('Erro ao restaurar vitalidade:', error)
      toast.error('Erro ao restaurar vitalidade')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <EditableField
                characterId={characterId}
                section="basic"
                field="characterName"
                value={characterName}
                label="Nome do Personagem"
                placeholder="Digite o nome do personagem"
                isEditMode={isEditMode}
              />

              <EditableField
                characterId={characterId}
                section="basic"
                field="playerName"
                value={playerName}
                label="Jogador"
                placeholder="Digite o nome do jogador"
                isEditMode={isEditMode}
              />

              <EditableField
                characterId={characterId}
                section="basic"
                field="class"
                value={charClass}
                label="Classe"
                placeholder="Digite a classe"
                isEditMode={isEditMode}
              />

              <EditableField
                characterId={characterId}
                section="basic"
                field="race"
                value={race}
                label="Raça"
                placeholder="Digite a raça"
                isEditMode={isEditMode}
              />

              <EditableField
                characterId={characterId}
                section="basic"
                field="deity"
                value={deity}
                label="Divindade"
                placeholder="Digite a divindade"
                isEditMode={isEditMode}
              />

              <EditableField
                characterId={characterId}
                section="basic"
                field="homeland"
                value={homeland}
                label="Terra Natal"
                placeholder="Digite a terra natal"
                isEditMode={isEditMode}
              />

              <EditableField
                characterId={characterId}
                section="basic"
                field="alignment"
                value={alignment}
                label="Tendência"
                placeholder="Digite a tendência"
                isEditMode={isEditMode}
              />

              <EditableField
                characterId={characterId}
                section="basic"
                field="gender"
                value={gender}
                label="Gênero"
                placeholder="Digite o gênero"
                isEditMode={isEditMode}
              />

              <EditableField
                characterId={characterId}
                section="basic"
                field="age"
                value={age}
                label="Idade"
                placeholder="Digite a idade"
                isEditMode={isEditMode}
              />

              <EditableField
                characterId={characterId}
                section="basic"
                field="weight"
                value={weight}
                label="Peso"
                placeholder="Digite o peso"
                isEditMode={isEditMode}
              />

              <EditableField
                characterId={characterId}
                section="basic"
                field="height"
                value={height}
                label="Altura"
                placeholder="Digite a altura"
                isEditMode={isEditMode}
              />

              <EditableField
                characterId={characterId}
                section="basic"
                field="virtuePoints"
                value={virtuePoints}
                label="Pontos de Virtude"
                placeholder="Digite os pontos de virtude"
                isEditMode={isEditMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* XP e Nível */}
        <Card>
          <CardHeader>
            <CardTitle>Experiência e Nível</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Nível Atual</label>
                <div className="text-2xl font-bold text-primary">
                  <EditableNumberField
                    characterId={characterId}
                    section="basic"
                    field="level"
                    value={level || 0}
                    min={0}
                    max={99}
                    className="text-center"
                    displayClassName="text-2xl font-bold text-primary"
                    isEditMode={isEditMode}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">XP Atual</label>
                <div className="text-lg font-medium">
                  <EditableNumberField
                    characterId={characterId}
                    section="basic"
                    field="currentXP"
                    value={currentXP || 0}
                    className="text-center"
                    displayClassName="text-lg font-medium"
                    isEditMode={isEditMode}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">XP para Próximo</label>
                <div className="text-lg font-medium text-muted-foreground">
                  {calculateXPForNextLevel(level || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha - Atributos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Atributos - Resumo */}
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
                const levelBonus = calculateAttributeBonus(level || 0)
                const total = (attr.race || 0) + (attr.class || 0) + (attr.bonus || 0) + levelBonus

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

        {/* Distribuição de Atributos */}
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
                  const levelBonus = calculateAttributeBonus(level || 0)
                  const total = (attr.race || 0) + (attr.class || 0) + (attr.bonus || 0) + levelBonus

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
      </div>

      {/* Terceira linha - Vitalidade e Berkana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Vitalidade */}
        <Card data-section="vitality">
          <CardHeader>
            <CardTitle>Vitalidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Valores base de raça e classe */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Raça</label>
                <EditableNumberField
                  characterId={characterId}
                  currentCharacterData={character}
                  section="vitality"
                  field="race"
                  value={vitality.race || 0}
                  isEditMode={isEditMode}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Classe</label>
                <EditableNumberField
                  characterId={characterId}
                  currentCharacterData={character}
                  section="vitality"
                  field="class"
                  value={vitality.class || 0}
                  isEditMode={isEditMode}
                />
              </div>
            </div>

            <Separator />

            {/* Vitalidade Total e Atual */}
            {(() => {
              const calculatedVitality = calculateVitality(
                vitality.race || 0,
                vitality.class || 0,
                level || 0
              )

              // Calcular vitalidade total (soma de todos os níveis)
              const totalVitality = Object.values(calculatedVitality).reduce((sum, val) => sum + val, 0)

              // Calcular vitalidade atual (soma dos valores atuais)
              const currentTotal = VITALITY_LEVELS.reduce((sum, vitalityKey) => {
                const currentValue = currentVitality[vitalityKey] !== undefined && currentVitality[vitalityKey] !== null
                  ? currentVitality[vitalityKey]
                  : calculatedVitality[vitalityKey]
                return sum + currentValue
              }, 0)

              return (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Vitalidade Atual</label>
                    <div className="text-2xl font-bold text-primary">{currentTotal}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Vitalidade Total</label>
                    <div className="text-2xl font-bold text-muted-foreground">{totalVitality}</div>
                  </div>
                </div>
              )
            })()}

            <Separator />

            {/* Sistema de Dano/Cura */}
            <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Sistema de Dano/Cura
              </h4>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Valor do dano"
                    value={damageValue}
                    onChange={(e) => setDamageValue(e.target.value)}
                    disabled={!isEditMode || updateCharacterMutation.isPending}
                    className="text-center"
                    min="0"
                  />
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => applyDamage(parseInt(damageValue) || 0)}
                  disabled={!isEditMode || !damageValue || updateCharacterMutation.isPending}
                  className="px-4"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Aplicar Dano
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={restoreFullHealth}
                  disabled={!isEditMode || updateCharacterMutation.isPending}
                  className="px-4"
                >
                  <Heart className="w-3 h-3 mr-1" />
                  Vida Máxima
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                O dano será aplicado de cima para baixo (do maior nível para o menor)
              </div>
            </div>

            <Separator />

            {/* Vitalidades calculadas */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Níveis de Vitalidade</h4>
              {(() => {
                const calculatedVitality = calculateVitality(
                  vitality.race || 0,
                  vitality.class || 0,
                  level || 0
                )

                return VITALITY_LEVELS.map((vitalityKey) => (
                  <div key={vitalityKey} className="flex justify-between items-center">
                    <span className="text-sm">{VITALITY_LABELS[vitalityKey]}:</span>
                    <div className="flex items-center gap-2">
                      <EditableNumberField
                        characterId={characterId}
                        currentCharacterData={character}
                        section="currentVitality"
                        field={vitalityKey}
                        value={currentVitality[vitalityKey] !== undefined && currentVitality[vitalityKey] !== null
                          ? currentVitality[vitalityKey]
                          : calculatedVitality[vitalityKey]}
                        className="w-20 text-center text-sm"
                        isEditMode={isEditMode}
                      />
                      <span className="text-xs text-muted-foreground">
                        / {calculatedVitality[vitalityKey]}
                      </span>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Berkana */}
        <Card data-section="berkana">
          <CardHeader>
            <CardTitle>Berkana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(() => {
              const calculatedMax = calculateBerkana(level || 0, berkanaBonus || 0)
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
      </div>

      {/* Quarta linha - Armas e Linguagens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Armas (Máximo 3) */}
        <Card data-section="weapons">
          <CardHeader>
            <CardTitle>Armas (Máximo 3)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[0, 1, 2].map((weaponIndex) => {
                const weapon = weapons[weaponIndex.toString()] || {}

                return (
                  <div key={weaponIndex} className="p-3 border rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <EditableField
                          characterId={characterId}
                          currentCharacterData={character}
                          section="weapons"
                          field={`${weaponIndex}.name`}
                          value={weapon.name}
                          placeholder={`Nome da Arma ${weaponIndex + 1}`}
                          label="Nome"
                        />
                      </div>
                      <div className="w-20">
                        <EditableNumberField
                          characterId={characterId}
                          currentCharacterData={character}
                          section="weapons"
                          field={`${weaponIndex}.level`}
                          value={weapon.level || 0}
                          label="Nível"
                          min={0}
                          max={99}
                          className="text-center"
                        />
                      </div>
                    </div>

                    {/* Danos */}
                    <div>
                      <label className="text-xs font-medium mb-1 block">Dano</label>
                      <div className="grid grid-cols-5 gap-1">
                        <div>
                          <EditableField
                            characterId={characterId}
                            currentCharacterData={character}
                            section="weapons"
                            field={`${weaponIndex}.damage.d25`}
                            value={weapon.damage?.d25}
                            placeholder="25%"
                            className="text-center text-xs"
                          />
                          <div className="text-xs text-center text-muted-foreground">25%</div>
                        </div>
                        <div>
                          <EditableField
                            characterId={characterId}
                            currentCharacterData={character}
                            section="weapons"
                            field={`${weaponIndex}.damage.d50`}
                            value={weapon.damage?.d50}
                            placeholder="50%"
                            className="text-center text-xs"
                          />
                          <div className="text-xs text-center text-muted-foreground">50%</div>
                        </div>
                        <div>
                          <EditableField
                            characterId={characterId}
                            currentCharacterData={character}
                            section="weapons"
                            field={`${weaponIndex}.damage.d75`}
                            value={weapon.damage?.d75}
                            placeholder="75%"
                            className="text-center text-xs"
                          />
                          <div className="text-xs text-center text-muted-foreground">75%</div>
                        </div>
                        <div>
                          <EditableField
                            characterId={characterId}
                            currentCharacterData={character}
                            section="weapons"
                            field={`${weaponIndex}.damage.d100`}
                            value={weapon.damage?.d100}
                            placeholder="100%"
                            className="text-center text-xs"
                          />
                          <div className="text-xs text-center text-muted-foreground">100%</div>
                        </div>
                        <div>
                          <EditableField
                            characterId={characterId}
                            currentCharacterData={character}
                            section="weapons"
                            field={`${weaponIndex}.damage.critical`}
                            value={weapon.damage?.critical}
                            placeholder="Crítico"
                            className="text-center text-xs"
                          />
                          <div className="text-xs text-center text-muted-foreground">Crítico</div>
                        </div>
                      </div>
                    </div>

                    {/* Observações */}
                    <div>
                      <EditableTextArea
                        characterId={characterId}
                        currentCharacterData={character}
                        section="weapons"
                        field={`${weaponIndex}.description`}
                        value={weapon.description}
                        placeholder="Observações/Descrição da arma"
                        rows={2}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Armadura */}
        <Card>
          <CardHeader>
            <CardTitle>Armadura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <EditableField
                  characterId={characterId}
                  currentCharacterData={character}
                  section="armor"
                  field="name"
                  value={armor.name}
                  placeholder="Nome da armadura"
                  label="Nome"
                />
              </div>
              <div>
                <EditableNumberField
                  characterId={characterId}
                  currentCharacterData={character}
                  section="armor"
                  field="totalVitality"
                  value={armor.totalVitality || 0}
                  label="Vitalidade Total"
                  className="text-center"
                />
              </div>
            </div>

            <div>
              <EditableNumberField
                characterId={characterId}
                currentCharacterData={character}
                section="armor"
                field="currentVitality"
                value={armor.currentVitality || 0}
                label="Vitalidade Atual"
                className="text-center"
              />
            </div>

            <div>
              <EditableTextArea
                characterId={characterId}
                currentCharacterData={character}
                section="armor"
                field="description"
                value={armor.description}
                placeholder="Descrição da armadura"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quinta linha - Linguagens */}
      <Card>
        <CardHeader>
          <CardTitle>Linguagens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Linguagens Padrão</h4>
            <div className="grid grid-cols-2 gap-3">
              {STANDARD_LANGUAGES.map((lang) => {
                const known = languages.standard?.[lang] || false

                const handleLanguageChange = async (checked: boolean) => {
                  try {
                    const updateData = {
                      languages: {
                        ...languages,
                        standard: {
                          ...languages.standard,
                          [lang]: checked
                        }
                      }
                    }
                    await updateCharacterMutation.mutateAsync({
                      id: characterId,
                      data: updateData
                    })
                  } catch (error) {
                    console.error('Erro ao atualizar linguagem:', error)
                  }
                }

                return (
                  <div key={lang} className="flex items-center space-x-2">
                    <Checkbox
                      id={`lang-${lang}`}
                      checked={known}
                      onCheckedChange={handleLanguageChange}
                      disabled={updateCharacterMutation.isPending}
                    />
                    <label
                      htmlFor={`lang-${lang}`}
                      className="text-sm font-medium capitalize cursor-pointer"
                    >
                      {lang}
                    </label>
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Linguagens Customizadas</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const newCustomLanguages = [...(languages.custom || []), { name: '', known: false }]
                    const updateData = {
                      languages: {
                        ...languages,
                        custom: newCustomLanguages
                      }
                    }
                    await updateCharacterMutation.mutateAsync({
                      id: characterId,
                      data: updateData
                    })
                  } catch (error) {
                    console.error('Erro ao adicionar linguagem:', error)
                  }
                }}
              >
                + Adicionar
              </Button>
            </div>

            {languages.custom && languages.custom.length > 0 ? (
              <div className="space-y-2">
                {languages.custom.map((lang: any, index: number) => {
                  const handleCustomLanguageChange = async (checked: boolean) => {
                    try {
                      const updatedCustom = [...languages.custom]
                      updatedCustom[index] = { ...updatedCustom[index], known: checked }

                      const updateData = {
                        languages: {
                          ...languages,
                          custom: updatedCustom
                        }
                      }
                      await updateCharacterMutation.mutateAsync({
                        id: characterId,
                        data: updateData
                      })
                    } catch (error) {
                      console.error('Erro ao atualizar linguagem customizada:', error)
                    }
                  }

                  return (
                    <div key={index} className="flex items-center gap-2">
                      <Checkbox
                        id={`custom-lang-${index}`}
                        checked={lang.known || false}
                        onCheckedChange={handleCustomLanguageChange}
                        disabled={updateCharacterMutation.isPending}
                      />
                      <div className="flex-1">
                        <EditableField
                          characterId={characterId}
                          currentCharacterData={character}
                          section="languages"
                          field={`custom.${index}.name`}
                          value={lang.name}
                          placeholder="Nome da linguagem"
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Nenhuma linguagem customizada. Clique em "Adicionar" para criar uma.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}