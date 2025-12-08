"use client"

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Check, X, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCharacterStore, useIsFieldEditing } from '@/lib/store/character'
import { useUpdateCharacter } from '@/lib/api/queries'

// ============================================
// TIPOS
// ============================================

export interface ScalingData {
  base: number | string
  perLevel: number | null
}

interface EditableScalingFieldProps {
  characterId?: string
  currentCharacterData?: any
  section: string
  field: string
  scalingData: ScalingData
  spellLevel: number
  characterLevel: number
  label?: string
  type: 'damage' | 'duration'
  isEditMode?: boolean
  className?: string
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Normaliza dados de escalonamento para o formato correto
 * Lida com dados antigos (strings) e converte para o novo formato
 */
export function normalizeScalingData(
  data: any,
  type: 'damage' | 'duration'
): ScalingData {
  // Já está no formato correto
  if (typeof data === 'object' && data !== null && 'base' in data) {
    return {
      base: data.base ?? (type === 'damage' ? 0 : ''),
      perLevel: data.perLevel ?? null
    }
  }

  // String antiga - tentar parsear
  if (typeof data === 'string' && data.trim()) {
    // Tentar extrair padrão "X + Y P/N" ou "XdY + Z P/N"
    const match = data.match(/^(.+?)\s*\+\s*(\d+)\s*P\/N/i)
    if (match) {
      const base = type === 'damage' ? parseInt(match[1]) || 0 : match[1].trim()
      const perLevel = parseInt(match[2]) || null
      return { base, perLevel }
    }

    // Sem escalonamento, só valor base
    if (type === 'damage') {
      const numMatch = data.match(/^(\d+)/)
      return { base: numMatch ? parseInt(numMatch[1]) : 0, perLevel: null }
    } else {
      return { base: data.trim(), perLevel: null }
    }
  }

  // Número simples (para dano)
  if (typeof data === 'number') {
    return { base: data, perLevel: null }
  }

  // Fallback
  return {
    base: type === 'damage' ? 0 : '',
    perLevel: null
  }
}

/**
 * Calcula o valor final baseado no escalonamento por nível
 * Fórmula: base + (perLevel × (characterLevel - spellLevel))
 * O bônus só conta a partir do nível seguinte ao nível da magia
 */
export function calculateScaledValue(
  base: number | string,
  perLevel: number | null,
  spellLevel: number,
  characterLevel: number
): { total: string; bonus: number; formula: string } {
  const levelDiff = Math.max(0, characterLevel - spellLevel)
  const bonus = perLevel ? perLevel * levelDiff : 0

  if (typeof base === 'number') {
    // Dano: base é número
    const total = base + bonus
    const formula = perLevel && levelDiff > 0
      ? `${base} + ${levelDiff}×${perLevel}`
      : `${base}`
    return { total: total.toString(), bonus, formula }
  } else {
    // Duração: base é string (dado como "1d6")
    if (bonus > 0) {
      return {
        total: `${base} + ${bonus}`,
        bonus,
        formula: `${base} + ${levelDiff}×${perLevel}`
      }
    }
    return { total: base, bonus: 0, formula: base }
  }
}

/**
 * Constrói o objeto de update para campos de scaling
 */
function buildScalingUpdateData(
  section: string,
  field: string,
  value: ScalingData,
  currentData?: any
): Record<string, any> {
  const fieldPath = field.split('.')
  const updateData: Record<string, any> = {}

  if (fieldPath.length === 2) {
    // Campo como "0.damage"
    const [index, fieldName] = fieldPath

    const currentArray = Array.isArray(currentData?.[section]) ? currentData[section] : []
    const resultArray = [...currentArray]

    const idx = parseInt(index)
    if (resultArray[idx]) {
      resultArray[idx] = {
        ...resultArray[idx],
        [fieldName]: value
      }
    }

    updateData[section] = resultArray
  }

  return updateData
}

// ============================================
// COMPONENTE
// ============================================

export function EditableScalingField({
  characterId,
  currentCharacterData,
  section,
  field,
  scalingData,
  spellLevel,
  characterLevel,
  label,
  type,
  isEditMode = true,
  className
}: EditableScalingFieldProps) {
  // Normalizar scalingData para o formato correto (lida com dados antigos)
  const normalizedData = normalizeScalingData(scalingData, type)

  // Estados
  const [localBase, setLocalBase] = useState(normalizedData.base?.toString() || '')
  const [localPerLevel, setLocalPerLevel] = useState(normalizedData.perLevel?.toString() || '')
  const [hasChanges, setHasChanges] = useState(false)

  const baseInputRef = useRef<HTMLInputElement>(null)

  // Store Zustand
  const { startEditing, cancelEditing } = useCharacterStore()
  const isEditing = useIsFieldEditing(section, field)

  // Mutation
  const updateCharacterMutation = useUpdateCharacter()
  const isSaving = updateCharacterMutation.isPending

  // Calcular valor final
  const calculated = calculateScaledValue(
    normalizedData.base,
    normalizedData.perLevel,
    spellLevel,
    characterLevel
  )

  // ============================================
  // EFEITOS
  // ============================================

  useEffect(() => {
    if (!isEditing) {
      setLocalBase(normalizedData.base?.toString() || '')
      setLocalPerLevel(normalizedData.perLevel?.toString() || '')
      setHasChanges(false)
    }
  }, [normalizedData.base, normalizedData.perLevel, isEditing])

  useEffect(() => {
    if (isEditing && baseInputRef.current) {
      baseInputRef.current.focus()
      baseInputRef.current.select()
    }
  }, [isEditing])

  // ============================================
  // HANDLERS
  // ============================================

  const handleStartEdit = () => {
    if (!isEditMode) return
    startEditing(section, field, normalizedData)
    setLocalBase(normalizedData.base?.toString() || '')
    setLocalPerLevel(normalizedData.perLevel?.toString() || '')
    setHasChanges(false)
  }

  const handleCancel = () => {
    setLocalBase(normalizedData.base?.toString() || '')
    setLocalPerLevel(normalizedData.perLevel?.toString() || '')
    setHasChanges(false)
    cancelEditing()
  }

  const handleBaseChange = (value: string) => {
    setLocalBase(value)
    setHasChanges(true)
  }

  const handlePerLevelChange = (value: string) => {
    setLocalPerLevel(value)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!hasChanges) {
      cancelEditing()
      return
    }

    try {
      const newValue: ScalingData = {
        base: type === 'damage' ? parseInt(localBase) || 0 : localBase,
        perLevel: localPerLevel ? parseInt(localPerLevel) : null
      }

      if (characterId) {
        const updateData = buildScalingUpdateData(section, field, newValue, currentCharacterData)
        await updateCharacterMutation.mutateAsync({
          id: characterId,
          data: updateData
        })
      }

      setHasChanges(false)
      cancelEditing()
    } catch (error) {
      console.error('Erro ao salvar campo:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    }
  }

  // ============================================
  // RENDER - MODO VISUALIZAÇÃO
  // ============================================

  if (!isEditing) {
    return (
      <div className={cn("group", className)}>
        {label && (
          <label className="text-sm font-medium text-muted-foreground mb-1 block">
            {label}
          </label>
        )}

        <div
          onClick={handleStartEdit}
          className={cn(
            "relative cursor-pointer rounded-md border border-transparent p-2 transition-all",
            "hover:border-border hover:bg-muted/50",
            !isEditMode && "cursor-not-allowed bg-muted/30"
          )}
        >
          <span className="font-medium">{calculated.total}</span>

          {normalizedData.perLevel && normalizedData.perLevel > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              ({calculated.formula})
            </span>
          )}

          {isEditMode && (
            <Edit className="absolute top-2 right-2 size-3 opacity-0 transition-opacity group-hover:opacity-50" />
          )}
        </div>
      </div>
    )
  }

  // ============================================
  // RENDER - MODO EDIÇÃO
  // ============================================

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}

      <div className="flex items-center gap-2">
        {/* Base */}
        <div className="flex-1">
          <Input
            ref={baseInputRef}
            value={localBase}
            onChange={(e) => handleBaseChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={type === 'damage' ? '0' : '1d6'}
            type={type === 'damage' ? 'number' : 'text'}
            disabled={isSaving}
            className={cn(
              "text-center",
              hasChanges && "border-yellow-500 ring-1 ring-yellow-500/20"
            )}
          />
          <div className="text-xs text-muted-foreground text-center mt-1">Base</div>
        </div>

        <span className="text-muted-foreground">+</span>

        {/* Por Nível */}
        <div className="flex-1">
          <Input
            value={localPerLevel}
            onChange={(e) => handlePerLevelChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0"
            type="number"
            disabled={isSaving}
            className={cn(
              "text-center",
              hasChanges && "border-yellow-500 ring-1 ring-yellow-500/20"
            )}
          />
          <div className="text-xs text-muted-foreground text-center mt-1">/Nível</div>
        </div>

        {/* Botões */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="size-7 p-0"
          >
            {isSaving ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Check className="size-3" />
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            disabled={isSaving}
            className="size-7 p-0"
          >
            <X className="size-3" />
          </Button>
        </div>
      </div>

      {/* Preview do cálculo */}
      {(localBase || localPerLevel) && (
        <div className="text-xs text-muted-foreground text-center">
          {(() => {
            const previewBase = type === 'damage' ? parseInt(localBase) || 0 : localBase
            const previewPerLevel = localPerLevel ? parseInt(localPerLevel) : null
            const preview = calculateScaledValue(previewBase, previewPerLevel, spellLevel, characterLevel)
            return `= ${preview.total}`
          })()}
        </div>
      )}
    </div>
  )
}
