// components/character/basic-info/vitality-card.tsx

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { EditableNumberField } from '@/components/ui/editable-field'
import { Heart, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { VITALITY_LEVELS, VITALITY_LABELS } from '@/lib/constants/character'
import { calculateVitalityLevels, toVitalityBase } from '@/lib/calculations'

import type { CharacterTabProps, UpdateCharacterMutation } from '../types'

interface VitalityCardProps extends Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'> {
  updateCharacterMutation: UpdateCharacterMutation
}

export function VitalityCard({ character, characterId, isEditMode, updateCharacterMutation }: VitalityCardProps) {
  const [damageValue, setDamageValue] = useState('')

  const {
    level,
    vitality = {},
    currentVitality = {},
  } = character

  // Funções para sistema de dano/cura da vitalidade
  const applyDamage = async (damageAmount: number) => {
    if (!damageAmount || damageAmount <= 0) {
      toast.error('Digite um valor de dano válido')
      return
    }

    try {
      const calculatedVitality = calculateVitalityLevels(toVitalityBase(vitality), level || 0)

      // Criar cópia dos valores atuais de vitalidade
      const newCurrentVitality = { ...currentVitality }
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
      const calculatedVitality = calculateVitalityLevels(toVitalityBase(vitality), level || 0)

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
          const calculatedVitality = calculateVitalityLevels(toVitalityBase(vitality), level || 0)

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
            const calculatedVitality = calculateVitalityLevels(toVitalityBase(vitality), level || 0)

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
  )
}
