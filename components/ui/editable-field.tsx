"use client"

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
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
import { useCharacterStore, useIsFieldEditing } from '@/lib/store/character'
import { useUpdateCharacter } from '@/lib/api/queries'
import type { UpdateCharacterRequest } from '@/lib/schemas/character'
import { calculateAttributeTotal, getAttributeLevelBonus } from '@/lib/calculations'

// ============================================
// TIPOS DE DADOS
// ============================================

// Valor que um campo inline edita (texto digitado ou número já convertido)
type FieldValue = string | number

// Dados atuais do personagem, indexados pelo nome da seção (colunas Json do banco)
export type CurrentCharacterData = Record<string, unknown>

// Uma seção Json: item → campo → valor (ex.: attributes.agilidade.race, weapons.0.damage.d25)
type SectionData = Record<string, Record<string, Record<string, unknown>>>

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Constrói o objeto de update baseado na seção e campo que está sendo editado
 * Preserva valores existentes para campos aninhados
 */
function buildUpdateData(
  section: string,
  field: string,
  value: FieldValue,
  currentData?: CurrentCharacterData
): Record<string, unknown> {
  const updateData: Record<string, unknown> = {}
  // Seção atual do personagem: item → campo → valor (arrays do banco indexados por "0", "1", ...)
  const currentSection = currentData?.[section] as SectionData | undefined

  // Para campos básicos, usar diretamente
  if (section === 'basic') {
    updateData[field] = value
    return updateData
  }

  // Para campos de berkana, mapear para os nomes corretos no banco
  if (section === 'berkana') {
    const fieldMap: Record<string, string> = {
      'current': 'currentBerkana',
      'max': 'maxBerkana',
      'bonus': 'berkanaBonus'
    }
    
    const dbFieldName = fieldMap[field] || field
    updateData[dbFieldName] = value
    return updateData
  }

  // Para campos aninhados, preservar dados existentes
  const fieldPath = field.split('.')

  if (fieldPath.length > 2) {
    // Campo tri-aninhado como "0.damage.d25"
    const [parentKey, middleKey, childKey] = fieldPath

    // Preservar dados existentes
    const existingParentData = currentSection?.[parentKey] || {}
    const existingMiddleData = existingParentData[middleKey] || {}

    const sectionData = {
      ...currentSection,
      [parentKey]: {
        ...existingParentData,
        [middleKey]: {
          ...existingMiddleData,
          [childKey]: value
        }
      }
    }

    // Para weapons, converter objeto para array
    if (section === 'weapons') {
      const weaponsArray = []
      for (let i = 0; i < 3; i++) {
        if (sectionData[i.toString()]) {
          weaponsArray[i] = sectionData[i.toString()]
        }
      }
      updateData[section] = weaponsArray
    } else if (section === 'adventureKit' || section === 'spells' || section === 'talents') {
      // Para arrays (adventureKit, spells, talents), converter objeto para array preservando todos os itens
      const currentArray = Array.isArray(currentSection) ? currentSection : []
      const resultArray = []

      // Preservar todos os itens existentes
      for (let i = 0; i < currentArray.length; i++) {
        if (sectionData[i.toString()]) {
          resultArray[i] = sectionData[i.toString()]
        } else {
          resultArray[i] = currentArray[i]
        }
      }

      updateData[section] = resultArray
    } else {
      updateData[section] = sectionData
    }
  } else if (fieldPath.length > 1) {
    // Campo bi-aninhado como "agilidade.race" ou "0.name"
    const [parentKey, childKey] = fieldPath

    // Preservar dados existentes do parent
    const existingParentData = currentSection?.[parentKey] || {}

    const sectionData = {
      ...currentSection,
      [parentKey]: {
        ...existingParentData,
        [childKey]: value
      }
    }

    // Para weapons, converter objeto para array
    if (section === 'weapons') {
      const weaponsArray = []
      for (let i = 0; i < 3; i++) {
        if (sectionData[i.toString()]) {
          weaponsArray[i] = sectionData[i.toString()]
        }
      }
      updateData[section] = weaponsArray
    } else if (section === 'adventureKit' || section === 'spells' || section === 'talents') {
      // Para arrays (adventureKit, spells, talents), converter objeto para array preservando todos os itens
      const currentArray = Array.isArray(currentSection) ? currentSection : []
      const resultArray = []

      // Preservar todos os itens existentes
      for (let i = 0; i < currentArray.length; i++) {
        if (sectionData[i.toString()]) {
          resultArray[i] = sectionData[i.toString()]
        } else {
          resultArray[i] = currentArray[i]
        }
      }

      updateData[section] = resultArray
    } else {
      updateData[section] = sectionData
    }
  } else {
    // Campo simples na seção
    updateData[section] = {
      ...currentSection,
      [field]: value
    }
  }

  return updateData
}

// ============================================
// TIPOS
// ============================================

interface EditableFieldProps {
  characterId: string // ID do personagem para auto-save (obrigatório)
  section: string
  field: string
  value: FieldValue | null | undefined
  currentCharacterData?: CurrentCharacterData // Dados atuais do personagem para preservar valores aninhados
  type?: 'input' | 'textarea' | 'number'
  placeholder?: string
  className?: string
  displayClassName?: string
  label?: string
  disabled?: boolean
  multiline?: boolean
  rows?: number
  onSave?: (value: FieldValue) => Promise<void>
  formatDisplay?: (value: FieldValue | null | undefined) => string
  parseValue?: (value: string) => FieldValue
  isEditMode?: boolean // Controle global de edição
}

// ============================================
// COMPONENTE EDITABLEFIELD
// ============================================

export function EditableField({
  characterId,
  section,
  field,
  value,
  currentCharacterData,
  type = 'input',
  placeholder = 'Clique para editar...',
  className,
  displayClassName,
  label,
  disabled = false,
  multiline = false,
  rows = 3,
  onSave,
  formatDisplay,
  parseValue,
  isEditMode = true
}: EditableFieldProps) {
  // ============================================
  // ESTADOS E REFS
  // ============================================

  const [localValue, setLocalValue] = useState(value || '')
  const [hasChanges, setHasChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Store Zustand
  const { startEditing, cancelEditing } = useCharacterStore()
  const isEditing = useIsFieldEditing(section, field)

  // Mutation para update automático
  const updateCharacterMutation = useUpdateCharacter()

  // Estado de loading vem da mutation
  const isSaving = updateCharacterMutation.isPending

  // ============================================
  // EFEITOS
  // ============================================

  // Atualizar valor local quando props mudam
  useEffect(() => {
    if (!isEditing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza o rascunho local com a prop `value` quando o campo sai de edição
      setLocalValue(value || '')
      setHasChanges(false)
    }
  }, [value, isEditing])

  // Focar input quando entra em modo de edição
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select?.()
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
    if (disabled || !isEditMode) return
    setSaveStatus('idle')
    startEditing(section, field, value)
    setLocalValue(value || '')
    setHasChanges(false)
  }

  const handleCancel = () => {
    setSaveStatus('idle')
    setLocalValue(value || '')
    setHasChanges(false)
    cancelEditing()
  }

  const handleChange = (newValue: string) => {
    setLocalValue(newValue)
    setHasChanges(newValue !== (value || ''))
  }

  const handleSave = async () => {
    if (!hasChanges) {
      cancelEditing()
      return
    }

    try {
      const parsedValue = parseValue ? parseValue(localValue as string) : localValue

      if (onSave) {
        // Callback customizado
        await onSave(parsedValue)
      } else {
        // Auto-save usando updateCharacter mutation
        const updateData = buildUpdateData(section, field, parsedValue, currentCharacterData)

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
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancel()
    } else if (e.key === 'Enter' && e.ctrlKey && multiline) {
      e.preventDefault()
      handleSave()
    }
  }

  const handleBlur = () => {
    // Auto-save quando sair do campo
    if (hasChanges) {
      handleSave()
    } else {
      cancelEditing()
    }
  }

  // ============================================
  // FORMATAÇÃO
  // ============================================

  const displayValue = formatDisplay
    ? formatDisplay(value)
    : value || placeholder

  const isEmpty = !value || value === ''

  const canEdit = isEditMode && !disabled
  const state = resolveInlineFieldState({ isEditing, canEdit, isSaving, saveStatus })
  const numericClass = type === 'number' ? 'font-numeric tabular-nums' : undefined

  // ============================================
  // RENDER - MODO VISUALIZAÇÃO
  // ============================================

  if (!isEditing) {
    // Somente leitura: texto simples, travessão quando vazio
    const readonlyText = formatDisplay ? formatDisplay(value) : value || '—'
    const readonlyEmpty = !formatDisplay && isEmpty

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        {label && <label className={INLINE_FIELD_LABEL_CLASS}>{label}</label>}

        {state === 'readonly' ? (
          <span
            className={cn(
              inlineFieldFrameClassName(state),
              numericClass,
              readonlyEmpty && "text-muted-foreground",
              multiline && "whitespace-pre-wrap",
              displayClassName
            )}
          >
            {readonlyText}
          </span>
        ) : (
          <div
            role="button"
            tabIndex={canEdit ? 0 : -1}
            onClick={handleStartEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleStartEdit()
              }
            }}
            className={cn(
              inlineFieldFrameClassName(state),
              numericClass,
              multiline && "min-h-[60px] items-start py-2",
              displayClassName
            )}
          >
            <span
              className={cn(
                "min-w-0 flex-1 break-words",
                multiline && "whitespace-pre-wrap",
                isEmpty && !formatDisplay && "text-muted-foreground"
              )}
            >
              {displayValue}
            </span>
            <InlineFieldStatusIcon state={state} />
          </div>
        )}

        {state === 'error' && <InlineFieldRetry onRetry={handleStartEdit} />}
      </div>
    )
  }

  // ============================================
  // RENDER - MODO EDIÇÃO
  // ============================================

  const InputComponent = multiline || type === 'textarea' ? Textarea : Input

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <label className={INLINE_FIELD_LABEL_CLASS}>{label}</label>}

      {/* Campo de edição */}
      <div className="relative">
        <InputComponent
          ref={inputRef as React.Ref<HTMLInputElement & HTMLTextAreaElement>}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          type={type === 'number' ? 'number' : 'text'}
          rows={multiline ? rows : undefined}
          disabled={isSaving}
          aria-invalid={state === 'error' ? true : undefined}
          className={cn(
            inlineFieldFrameClassName(state),
            state === 'error' ? "pr-20" : "pr-12",
            multiline || type === 'textarea' ? "py-2" : "h-11",
            numericClass
          )}
        />

        {/* Ícone de estado e cancelar */}
        <div className="absolute top-0 right-0 flex h-11 items-center">
          <InlineFieldStatusIcon state={state} />
          {!isSaving && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11 text-muted-foreground"
              aria-label="Cancelar edição"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleCancel}
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* Dica (só texto longo: Ctrl+Enter não é descobrível) */}
      {multiline && (
        <span className="text-xs text-muted-foreground">
          Ctrl+Enter ou toque fora para salvar · Esc cancela
        </span>
      )}

      {/* Erro ao salvar */}
      {state === 'error' && <InlineFieldRetry keepFocus onRetry={handleSave} />}
    </div>
  )
}

// ============================================
// VARIAÇÕES PRÉ-CONFIGURADAS
// ============================================

/**
 * Campo para números com formatação
 */
export function EditableNumberField({
  value,
  min = 0,
  max,
  ...props
}: Omit<EditableFieldProps, 'type' | 'parseValue' | 'formatDisplay'> & {
  min?: number
  max?: number
}) {
  return (
    <EditableField
      {...props}
      type="number"
      value={value}
      parseValue={(val) => {
        const num = parseInt(val)
        if (isNaN(num)) return 0
        if (min !== undefined && num < min) return min
        if (max !== undefined && num > max) return max
        return num
      }}
      formatDisplay={(val) => val?.toString() || '0'}
    />
  )
}

/**
 * Campo para texto longo/anotações
 */
export function EditableTextArea({
  rows = 4,
  ...props
}: Omit<EditableFieldProps, 'multiline' | 'type'> & {
  rows?: number
}) {
  return (
    <EditableField
      {...props}
      multiline
      type="textarea"
      rows={rows}
    />
  )
}

/**
 * Campo para atributos (race + class + bonus)
 */
export function EditableAttributeField({
  section,
  field,
  attributeData,
  level,
  ...props
}: Omit<EditableFieldProps, 'value' | 'formatDisplay'> & {
  attributeData: { race: number; class: number; bonus: number }
  level: number
}) {
  const total = calculateAttributeTotal(attributeData, level)
  const levelBonus = getAttributeLevelBonus(level)

  return (
    <div className="space-y-2">
      {/* Total calculado (read-only) */}
      <div className="text-center">
        <div className="text-2xl font-bold">{total}</div>
        <div className="text-xs text-muted-foreground">Total</div>
      </div>

      {/* Campos editáveis */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <EditableNumberField
          section={section}
          field={`${field}.race`}
          value={attributeData.race}
          label="Raça"
          {...props}
        />
        <EditableNumberField
          section={section}
          field={`${field}.class`}
          value={attributeData.class}
          label="Classe"
          {...props}
        />
        <EditableNumberField
          section={section}
          field={`${field}.bonus`}
          value={attributeData.bonus}
          label="Bônus"
          {...props}
        />
      </div>

      {/* Fórmula */}
      <div className="text-xs text-muted-foreground text-center">
        {attributeData.race} + {attributeData.class} + {attributeData.bonus}
        {levelBonus > 0 && ` + ${levelBonus}`} = {total}
      </div>
    </div>
  )
}