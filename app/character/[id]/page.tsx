"use client"

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCharacter } from '@/lib/api/queries'
import { CharacterLayout } from '@/components/forms/character-layout'
import { Button } from '@/components/ui/button'
import {
  CharacterLoadErrorState,
  CharacterNotFoundState,
  CharacterSheetSkeleton,
  isCharacterNotFoundError,
} from '@/components/character/sheet-states'
import { ArrowLeft, Lock, LockOpen, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

// ============================================
// COMPONENTE PRINCIPAL - VERSÃO SIMPLIFICADA
// ============================================

export default function CharacterPage() {
  const params = useParams()
  const router = useRouter()
  const characterId = params.id as string
  
  // Estado do modo de edição (desbloqueado por padrão)
  const [isEditMode, setIsEditMode] = useState(true)

  // React Query para buscar personagem - ÚNICO SOURCE OF TRUTH
  const {
    data: characterResponse,
    isLoading,
    error,
    refetch
  } = useCharacter(characterId)

  // ============================================
  // HANDLERS
  // ============================================

  const handleBack = () => {
    router.push('/characters')
  }

  const handleRefresh = async () => {
    try {
      await refetch()
      toast.success('Personagem atualizado!')
    } catch {
      toast.error('Erro ao atualizar personagem')
    }
  }

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode)
    if (isEditMode) {
      toast('Ficha bloqueada', {
        id: 'edit-mode',
        duration: 1800,
        description: 'Modo leitura. Toque no cadeado para editar.',
        icon: <Lock className="size-5 text-muted-foreground" />,
      })
    } else {
      toast('Ficha desbloqueada', {
        id: 'edit-mode',
        duration: 1800,
        description: 'Toque em um campo para editar.',
        icon: <LockOpen className="size-5 text-primary" />,
      })
    }
  }

  // ============================================
  // ESTADOS DE LOADING E ERROR
  // ============================================

  if (isLoading) {
    return <CharacterSheetSkeleton />
  }

  if (error) {
    // 404 → não encontrado; rede/500 → falha ao carregar
    return isCharacterNotFoundError(error) ? (
      <CharacterNotFoundState onBack={handleBack} onRetry={handleRefresh} />
    ) : (
      <CharacterLoadErrorState onBack={handleBack} onRetry={handleRefresh} />
    )
  }

  // Garantir que os dados existem e são válidos
  const character = characterResponse?.character
  if (!character) {
    return <CharacterNotFoundState onBack={handleBack} />
  }

  // Sanitizar dados para evitar erros de map/undefined
  const sanitizedCharacter = {
    ...character,
    // Garantir arrays válidos
    weapons: Array.isArray(character.weapons) ? character.weapons : [],
    adventureKit: Array.isArray(character.adventureKit) ? character.adventureKit : [],
    spells: Array.isArray(character.spells) ? character.spells : [],
    talents: Array.isArray(character.talents) ? character.talents : [],

    // Garantir objetos válidos
    attributes: character.attributes || {},
    vitality: character.vitality || { race: 0, class: 0 },
    currentVitality: character.currentVitality || {
      notavel: 0, ferido: 0, gravementeFerido: 0,
      condenado: 0, incapacitado: 0, coma: 0
    },
    skills: character.skills || {},
    armor: character.armor || {
      name: '', description: '', totalVitality: 0, currentVitality: 0
    },
    finances: character.finances || {
      ouro: 0, prata: 0, cobre: 0, imperano: 0, joias: 0
    },
    languages: character.languages || {
      standard: {
        comum: false, errante: false, elfico: false,
        sombrio: false, anao: false, sigilico: false
      },
      custom: []
    }
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  // Subtítulo: jogador · classe · Nv N (partes vazias são puladas)
  const subtitle = [character.playerName, character.class, `Nv ${character.level || 0}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <CharacterLayout
      character={sanitizedCharacter}
      characterId={characterId}
      isEditMode={isEditMode}
      onToggleEditMode={handleToggleEditMode}
      header={
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-1 px-1.5 pt-1.5 pb-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label="Voltar"
            className="size-11"
          >
            <ArrowLeft className="size-[22px]" aria-hidden="true" />
          </Button>
          <div className="flex min-w-0 flex-1 flex-col">
            <h1 className="truncate font-serif text-[21px] leading-[1.15] font-semibold">
              {character.characterName}
            </h1>
            <p className="truncate text-[13px] text-muted-foreground">{subtitle}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            aria-label="Atualizar"
            className="size-11 text-muted-foreground"
          >
            <RefreshCw className="size-5" aria-hidden="true" />
          </Button>
        </div>
      }
    />
  )
}
