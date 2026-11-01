"use client"

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, LoaderCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  INLINE_FIELD_LABEL_CLASS,
  InlineFieldRetry,
  InlineFieldStatusIcon,
  SAVED_FEEDBACK_MS,
  inlineFieldFrameClassName,
  resolveInlineFieldState,
  type SaveStatus,
} from '@/components/ui/inline-field-state'
import type { CurrentCharacterData } from '@/components/ui/editable-field'
import { useCharacterStore, useIsFieldEditing } from '@/lib/store/character'
import { useUpdateCharacter } from '@/lib/api/queries'
import type { ScalingValue, UpdateCharacterRequest } from '@/lib/schemas/character'

// ============================================
// TIPOS
// ============================================

export interface ScalingData {
  base: number | string
  perLevel: number | null
}

interface EditableScalingFieldProps {
  characterId?: string
  currentCharacterData?: CurrentCharacterData
  section: string
  field: string
  scalingData: ScalingValue
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
  data: ScalingValue,
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
  currentData?: CurrentCharacterData
): Record<string, unknown> {
  const fieldPath = field.split('.')
  const updateData: Record<string, unknown> = {}

  if (fieldPath.length === 2) {
    // Campo como "0.damage"
    const [index, fieldName] = fieldPath

    const currentSection = currentData?.[section]
    const currentArray: Record<string, unknown>[] = Array.isArray(currentSection) ? currentSection : []
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza o rascunho local com a prop `scalingData` quando o campo sai de edição
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

  // Some o check de "salvo" depois de um instante
  useEffect(() => {
    if (saveStatus !== 'saved') return
    const timer = setTimeout(() => setSaveStatus('idle'), SAVED_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [saveStatus])

  // ============================================
  // HANDLERS
  // ============================================

  const handleStartEdit = () => {
    if (!isEditMode) return
    setSaveStatus('idle')
    startEditing(section, field, normalizedData)
    setLocalBase(normalizedData.base?.toString() || '')
    setLocalPerLevel(normalizedData.perLevel?.toString() || '')
    setHasChanges(false)
  }

  const handleCancel = () => {
    setSaveStatus('idle')
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
          data: updateData as UpdateCharacterRequest
        })
      }

      setHasChanges(false)
      cancelEditing()
      setSaveStatus('saved')
    } catch (error) {
      console.error('Erro ao salvar campo:', error)
      setSaveStatus('error')
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

  const state = resolveInlineFieldState({
    isEditing,
    canEdit: isEditMode,
    isSaving,
    saveStatus,
  })

  // ============================================
  // RENDER - MODO VISUALIZAÇÃO
  // ============================================

  if (!isEditing) {
    const content = (
      <>
        <span className="min-w-0 flex-1 break-words">
          <span className="font-numeric font-medium tabular-nums">{calculated.total}</span>

          {normalizedData.perLevel && normalizedData.perLevel > 0 && (
            <span className="ml-2 text-xs text-muted-foreground">
              ({calculated.formula})
            </span>
          )}
        </span>
        <InlineFieldStatusIcon state={state} />
      </>
    )

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {label && <label className={INLINE_FIELD_LABEL_CLASS}>{label}</label>}

        {state === 'readonly' ? (
          <span className={inlineFieldFrameClassName(state)}>{content}</span>
        ) : (
          <div
            role="button"
            tabIndex={isEditMode ? 0 : -1}
            onClick={handleStartEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleStartEdit()
              }
            }}
            className={inlineFieldFrameClassName(state)}
          >
            {content}
          </div>
        )}

        {state === 'error' && <InlineFieldRetry onRetry={handleStartEdit} />}
      </div>
    )
  }

  // ============================================
  // RENDER - MODO EDIÇÃO
  // ============================================

  const inputClassName = cn(
    inlineFieldFrameClassName(state),
    "h-11 text-center font-numeric tabular-nums"
  )

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <label className={INLINE_FIELD_LABEL_CLASS}>{label}</label>}

      <div className="flex items-start gap-2">
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
            className={inputClassName}
          />
          <div className={cn(INLINE_FIELD_LABEL_CLASS, "mt-1 text-center")}>Base</div>
        </div>

        <span className="flex h-11 items-center text-muted-foreground">+</span>

        {/* Por Nível */}
        <div className="flex-1">
          <Input
            value={localPerLevel}
            onChange={(e) => handlePerLevelChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="0"
            type="number"
            disabled={isSaving}
            className={inputClassName}
          />
          <div className={cn(INLINE_FIELD_LABEL_CLASS, "mt-1 text-center")}>/Nível</div>
        </div>

        {/* Botões */}
        <div className="flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="size-11"
            aria-label="Salvar"
          >
            {isSaving ? (
              <LoaderCircle className="size-5 animate-ficha-spin" aria-hidden="true" />
            ) : (
              <Check className="size-5" aria-hidden="true" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            disabled={isSaving}
            className="size-11"
            aria-label="Cancelar"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Preview do cálculo */}
      {(localBase || localPerLevel) && (
        <div className="text-center font-numeric text-xs tabular-nums text-muted-foreground">
          {(() => {
            const previewBase = type === 'damage' ? parseInt(localBase) || 0 : localBase
            const previewPerLevel = localPerLevel ? parseInt(localPerLevel) : null
            const preview = calculateScaledValue(previewBase, previewPerLevel, spellLevel, characterLevel)
            return `= ${preview.total}`
          })()}
        </div>
      )}

      {state === 'error' && <InlineFieldRetry onRetry={handleSave} />}
    </div>
  )
}
