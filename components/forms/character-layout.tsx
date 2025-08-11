// components/forms/character-layout.tsx
import { useState, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BasicInfoTab,
  SkillsKitTab,
  SpellsTalentsTab,
  NotesTab,
  type CharacterTabProps
} from '@/components/character'
import { QuickActionsBar } from '@/components/character/quick-actions-bar'
import { SkillsModal } from '@/components/character/skills-modal'
import { AttributesModal } from '@/components/character/attributes-modal'

// ============================================
// TIPOS
// ============================================

interface CharacterLayoutProps extends CharacterTabProps { }

// ============================================
// COMPONENTE PRINCIPAL - COM TABS FIXAS
// ============================================

export function CharacterLayout({ character, characterId, isEditMode }: CharacterLayoutProps) {
  const [activeTab, setActiveTab] = useState('basicos')
  const tabsRef = useRef<HTMLDivElement>(null)
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false)
  const [isAttributesModalOpen, setIsAttributesModalOpen] = useState(false)

  // Função para navegar entre tabs e seções
  const handleNavigate = (tab: string, section?: string) => {
    const needsTabChange = activeTab !== tab



    // Mudar para a tab correta
    if (needsTabChange) {
      setActiveTab(tab)
    }

    // Se há uma seção específica, scroll até ela
    if (section) {
      const scrollToSection = () => {
        const sectionElement = document.querySelector(`[data-section="${section}"]`)

        if (sectionElement) {
          sectionElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
            inline: 'nearest'
          })
        }
      }

      // Se mudou de tab, aguardar um pouco mais para o conteúdo carregar
      if (needsTabChange) {
        setTimeout(scrollToSection, 300)
      } else {
        // Se já está na tab correta, scroll imediatamente
        setTimeout(scrollToSection, 50)
      }
    }
  }

  // Função para abrir modal de perícias
  const handleOpenSkillsModal = () => {
    setIsSkillsModalOpen(true)
  }

  // Função para abrir modal de atributos
  const handleOpenAttributesModal = () => {
    setIsAttributesModalOpen(true)
  }

  return (
    <div className="w-full relative">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" ref={tabsRef}>
        {/* Navegação de Tabs Fixa */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-2 sm:px-4">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 my-2 sm:my-4 h-auto">
              <TabsTrigger value="basicos" className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-2">
                <span className="hidden sm:inline">Dados Básicos</span>
                <span className="sm:hidden">Básicos</span>
              </TabsTrigger>
              <TabsTrigger value="pericias" className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-2">
                <span className="hidden sm:inline">Perícias & Kit</span>
                <span className="sm:hidden">Perícias</span>
              </TabsTrigger>
              <TabsTrigger value="magias" className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-2">
                <span className="hidden sm:inline">Magias & Talentos</span>
                <span className="sm:hidden">Magias</span>
              </TabsTrigger>
              <TabsTrigger value="anotacoes" className="text-xs sm:text-sm px-1 py-2 sm:px-3 sm:py-2">
                <span className="hidden sm:inline">Anotações</span>
                <span className="sm:hidden">Notas</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="pt-6">
          <TabsContent value="basicos" className="mt-0">
            <BasicInfoTab 
              character={character} 
              characterId={characterId} 
              isEditMode={isEditMode}
              isAttributesModalOpen={isAttributesModalOpen}
              setIsAttributesModalOpen={setIsAttributesModalOpen}
            />
          </TabsContent>

          <TabsContent value="pericias" className="mt-0">
            <SkillsKitTab 
              character={character} 
              characterId={characterId} 
              isEditMode={isEditMode}
              isSkillsModalOpen={isSkillsModalOpen}
              setIsSkillsModalOpen={setIsSkillsModalOpen}
            />
          </TabsContent>

          <TabsContent value="magias" className="mt-0">
            <SpellsTalentsTab 
              character={character} 
              characterId={characterId} 
              isEditMode={isEditMode}
            />
          </TabsContent>

          <TabsContent value="anotacoes" className="mt-0">
            <NotesTab 
              character={character} 
              characterId={characterId} 
              isEditMode={isEditMode}
            />
          </TabsContent>
        </div>

        {/* Quick Actions Bar */}
        <QuickActionsBar
          character={character}
          onNavigate={handleNavigate}
          onOpenSkillsModal={handleOpenSkillsModal}
          onOpenAttributesModal={handleOpenAttributesModal}
        />
      </Tabs>

      {/* Modais - fora das tabs */}
      <SkillsModal
        isOpen={isSkillsModalOpen}
        onOpenChange={setIsSkillsModalOpen}
        character={character}
      />
      <AttributesModal
        isOpen={isAttributesModalOpen}
        onOpenChange={setIsAttributesModalOpen}
        character={character}
      />
    </div>
  )
}