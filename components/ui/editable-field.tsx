"use client"

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2, Edit, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCharacterStore, useIsFieldEditing } from '@/lib/store/character'
import { useUpdateCharacter } from '@/lib/api/queries'

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Constrói o objeto de update baseado na seção e campo que está sendo editado
 * Preserva valores existentes para campos aninhados
 */
function buildUpdateData(section: string, field: string, value: any, currentData?: any): Record<string, any> {
  const updateData: Record<string, any> = {}

  // Para campos básicos, usar diretamente
  if (section === 'basic') {
    updateData[field] = value
    return updateData
  }

  // Para campos aninhados, preservar dados existentes
  const fieldPath = field.split('.')

  if (fieldPath.length > 2) {
    // Campo tri-aninhado como "0.damage.d25"
    const [parentKey, middleKey, childKey] = fieldPath

    // Preservar dados existentes
    const existingParentData = currentData?.[section]?.[parentKey] || {}
    const existingMiddleData = existingParentData[middleKey] || {}

    const sectionData = {
      ...currentData?.[section],
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
      const currentArray = Array.isArray(currentData?.[section]) ? currentData[section] : []
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
    const existingParentData = currentData?.[section]?.[parentKey] || {}

    const sectionData = {
      ...currentData?.[section],
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
      const currentArray = Array.isArray(currentData?.[section]) ? currentData[section] : []
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
      ...currentData?.[section],
      [field]: value
    }
  }

  return updateData
}

// ============================================
// TIPOS
// ============================================

interface EditableFieldProps {
  characterId?: string // ID do personagem para auto-save
  section: string
  field: string
  value: any
  currentCharacterData?: any // Dados atuais do personagem para preservar valores aninhados
  type?: 'input' | 'textarea' | 'number'
  placeholder?: string
  className?: string
  displayClassName?: string
  label?: string
  disabled?: boolean
  multiline?: boolean
  rows?: number
  onSave?: (value: any) => Promise<void>
  formatDisplay?: (value: any) => string
  parseValue?: (value: string) => any
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
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Store Zustand
  const { startEditing, cancelEditing, saveField, error: storeError } = useCharacterStore()
  const isEditing = useIsFieldEditing(section, field)

  // Mutation para update automático
  const updateCharacterMutation = useUpdateCharacter()

  // Estados de loading e erro (priorizar mutation se disponível)
  const isSaving = characterId ? updateCharacterMutation.isPending : useCharacterStore(state => state.isSaving)
  const error = characterId ? updateCharacterMutation.error?.message : storeError

  // ============================================
  // EFEITOS
  // ============================================

  // Atualizar valor local quando props mudam
  useEffect(() => {
    if (!isEditing) {
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

  // ============================================
  // HANDLERS
  // ============================================

  const handleStartEdit = () => {
    if (disabled || !isEditMode) return
    startEditing(section, field, value)
    setLocalValue(value || '')
    setHasChanges(false)
  }

  const handleCancel = () => {
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
      const parsedValue = parseValue ? parseValue(localValue) : localValue

      if (onSave) {
        // Callback customizado
        await onSave(parsedValue)
      } else if (characterId) {
        // Auto-save usando updateCharacter mutation
        const updateData = buildUpdateData(section, field, parsedValue, currentCharacterData)

        await updateCharacterMutation.mutateAsync({
          id: characterId,
          data: updateData
        })
      } else {
        // Usar store padrão (fallback)
        useCharacterStore.getState().updateField(parsedValue)
        await saveField()
      }

      setHasChanges(false)
      cancelEditing()
    } catch (error) {
      console.error('Erro ao salvar campo:', error)
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
            // Base styles
            "relative cursor-pointer rounded-md border border-transparent p-2 transition-all",
            "hover:border-border hover:bg-muted/50",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",

            // Empty state
            isEmpty && "text-muted-foreground italic",

            // Disabled state  
            disabled && "cursor-not-allowed opacity-50",

            // Edit mode disabled (locked)
            !isEditMode && "cursor-not-allowed bg-muted/30",

            // Multiline
            multiline && "min-h-[60px]",

            // Custom display classes
            displayClassName
          )}
          tabIndex={disabled || !isEditMode ? -1 : 0}
        >
          {/* Conteúdo */}
          <span className={cn(
            "block",
            multiline && "whitespace-pre-wrap"
          )}>
            {displayValue}
          </span>

          {/* Ícone de edição */}
          {!disabled && (
            <Edit className="absolute top-2 right-2 size-3 opacity-0 transition-opacity group-hover:opacity-50" />
          )}
        </div>

        {/* Erro */}
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
      </div>
    )
  }

  // ============================================
  // RENDER - MODO EDIÇÃO
  // ============================================

  const InputComponent = multiline || type === 'textarea' ? Textarea : Input

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-muted-foreground">
          {label}
        </label>
      )}

      {/* Campo de edição */}
      <div className="relative">
        <InputComponent
          ref={inputRef as any}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          type={type === 'number' ? 'number' : 'text'}
          rows={multiline ? rows : undefined}
          disabled={isSaving}
          className={cn(
            "pr-20", // Espaço para botões
            hasChanges && "border-yellow-500 ring-1 ring-yellow-500/20"
          )}
        />

        {/* Botões de ação */}
        <div className="absolute right-1 top-1 flex gap-1">
          {/* Botão salvar */}
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

          {/* Botão cancelar */}
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

      {/* Feedback visual */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {hasChanges ? 'Mudanças não salvas' : 'Enter para salvar • Esc para cancelar'}
        </span>

        {multiline && (
          <span>Ctrl+Enter para salvar</span>
        )}
      </div>

      {/* Erro */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
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
  const total = attributeData.race + attributeData.class + attributeData.bonus +
    (level >= 5 ? Math.floor(level / 5) : 0)

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
        {level >= 5 && ` + ${Math.floor(level / 5)}`} = {total}
      </div>
    </div>
  )
}