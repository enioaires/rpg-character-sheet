"use client"

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCharacter } from '@/lib/api/queries'
import { CharacterLayout } from '@/components/forms/character-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, RefreshCw, Loader2, Lock, Unlock } from 'lucide-react'
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
    } catch (error) {
      toast.error('Erro ao atualizar personagem')
    }
  }

  const handleToggleEditMode = () => {
    setIsEditMode(!isEditMode)
    toast.success(
      isEditMode 
        ? 'Modo de edição desabilitado - Ficha bloqueada' 
        : 'Modo de edição habilitado - Ficha desbloqueada'
    )
  }

  // ============================================
  // ESTADOS DE LOADING E ERROR
  // ============================================

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando personagem...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-destructive">
                Erro ao carregar personagem
              </h2>
              <p className="text-muted-foreground">
                {error.message || 'Personagem não encontrado'}
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleBack} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <Button onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Garantir que os dados existem e são válidos
  const character = characterResponse?.character
  if (!character) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold">Personagem não encontrado</h2>
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button onClick={handleBack} variant="outline" size="sm" className="w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{character.characterName}</h1>
            {character.playerName && (
              <p className="text-sm sm:text-base text-muted-foreground">
                Jogador: {character.playerName}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleToggleEditMode} 
            variant={isEditMode ? "default" : "secondary"}
            size="sm"
            className={`${isEditMode ? "text-green-600 hover:text-green-700" : "text-red-600 hover:text-red-700"} flex-1 sm:flex-none`}
          >
            {isEditMode ? (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Desbloqueado</span>
                <span className="sm:hidden">Desbloq.</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Bloqueado</span>
                <span className="sm:hidden">Bloq.</span>
              </>
            )}
          </Button>
          
          <Button onClick={handleRefresh} variant="outline" size="sm" className="flex-1 sm:flex-none">
            <RefreshCw className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Atualizar</span>
            <span className="sm:hidden">Atual.</span>
          </Button>
        </div>
      </div>

      {/* Layout da Ficha */}
      <CharacterLayout character={sanitizedCharacter} characterId={characterId} isEditMode={isEditMode} />
    </div>
  )
}