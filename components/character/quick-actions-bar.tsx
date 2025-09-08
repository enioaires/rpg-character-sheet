// components/character/quick-actions-bar.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

import {
  Heart,
  Zap,
  Sword,
  Eye,
  EyeOff,
  Target,
  User,
  Lock,
  Unlock
} from 'lucide-react'
import {
  calculateVitality,
  calculateBerkana,
  VITALITY_LEVELS,
} from '@/lib/constants/character'
import { cn } from '@/lib/utils'

interface QuickActionsBarProps {
  character: any
  onNavigate: (tab: string, section?: string) => void
  onOpenSkillsModal?: () => void
  onOpenAttributesModal?: () => void
  isEditMode?: boolean
  onToggleEditMode?: () => void
}

export function QuickActionsBar({ character, onNavigate, onOpenSkillsModal, onOpenAttributesModal, isEditMode = true, onToggleEditMode }: QuickActionsBarProps) {
  const [isVisible, setIsVisible] = useState(true)

  const {
    level = 1,
    vitality = {},
    currentVitality = {},
    maxBerkana = 100,
    currentBerkana = 100,
    berkanaBonus = 0,
    weapons = {},
  } = character

  // Calcular valores
  const calculatedVitality = calculateVitality(
    vitality.race || 0,
    vitality.class || 0,
    level || 0
  )

  const calculatedBerkana = calculateBerkana(level || 0, berkanaBonus || 0)

  // Calcular vitalidade total atual
  const totalCurrentVitality = VITALITY_LEVELS.reduce((sum, key) => {
    const currentValue = currentVitality[key] !== undefined && currentVitality[key] !== null
      ? currentVitality[key]
      : calculatedVitality[key]
    return sum + (currentValue || 0)
  }, 0)

  const totalMaxVitality = Object.values(calculatedVitality).reduce((sum, val) => sum + (val || 0), 0)

  // Calcular berkana atual vs máxima
  const maxBerkanaValue = maxBerkana || calculatedBerkana
  const currentBerkanaValue = currentBerkana || maxBerkanaValue

  // Dados das quick actions
  const quickActions = [
    {
      id: 'vitality',
      label: 'Vitalidade',
      icon: Heart,
      value: `${totalCurrentVitality}/${totalMaxVitality}`,
      color: totalCurrentVitality <= totalMaxVitality * 0.3 ? 'destructive' :
        totalCurrentVitality <= totalMaxVitality * 0.6 ? 'warning' : 'default',
      onClick: () => onNavigate('basicos', 'vitality')
    },
    {
      id: 'berkana',
      label: 'Berkana',
      icon: Zap,
      value: `${currentBerkanaValue}/${maxBerkanaValue}`,
      color: currentBerkanaValue <= maxBerkanaValue * 0.3 ? 'destructive' :
        currentBerkanaValue <= maxBerkanaValue * 0.6 ? 'warning' : 'default',
      onClick: () => onNavigate('basicos', 'berkana')
    },
    {
      id: 'weapon',
      label: 'Arma',
      icon: Sword,
      value: weapons['0']?.level ? `Nv${weapons['0'].level}` : '-',
      color: 'default',
      onClick: () => onNavigate('basicos', 'weapons')
    },
    {
      id: 'skills',
      label: 'Perícias',
      icon: Target,
      value: 'Perícias',
      color: 'default',
      onClick: () => onOpenSkillsModal?.()
    },
    {
      id: 'attributes',
      label: 'Atributos',
      icon: User,
      value: 'Atributos',
      color: 'default',
      onClick: () => onOpenAttributesModal?.()
    },
    {
      id: 'editMode',
      label: isEditMode ? 'Desbloqueado' : 'Bloqueado',
      icon: isEditMode ? Unlock : Lock,
      value: '',
      color: isEditMode ? 'success' : 'destructive',
      onClick: () => onToggleEditMode?.()
    }
  ]

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-20">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsVisible(true)}
          className="bg-background/95 backdrop-blur"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="sticky bottom-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between py-2">
          {/* Toggle de visibilidade */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsVisible(false)}
            className="h-8 w-8 p-0"
          >
            <EyeOff className="h-4 w-4" />
          </Button>

          {/* Quick Actions */}
          <div className="flex-1 mx-2">
            <div className="flex items-center justify-center gap-1">
              {quickActions.map((action, index) => (
                <div key={action.id} className="flex items-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={action.onClick}
                    className={cn(
                      "h-8 px-0.5 text-xs",
                      action.color === 'destructive' && "text-red-600",
                      action.color === 'warning' && "text-yellow-600",
                      action.color === 'success' && "text-green-600",
                      action.color === 'secondary' && "text-muted-foreground"
                    )}
                  >
                    <action.icon className={cn(
                      "h-3 w-3",
                      action.value ? "mr-1" : ""
                    )} />
                    {action.value && <span className="font-mono">{action.value}</span>}
                  </Button>
                  {index < quickActions.length - 1 && (
                    <Separator orientation="vertical" className="h-4 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Espaço para balanceamento */}
          <div className="w-8"></div>
        </div>
      </div>
    </div>
  )
}