// components/forms/character-layout.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BasicInfoTab } from '@/components/character/basic-info-tab'
import { SkillsKitTab } from '@/components/character/skills-kit-tab'
import { SpellsTalentsTab } from '@/components/character/spells-talents-tab'

// ============================================
// TIPOS
// ============================================

interface CharacterLayoutProps {
  character: any
  characterId: string
  isEditMode: boolean
}

// ============================================
// COMPONENTE PRINCIPAL - COM TABS FIXAS
// ============================================

export function CharacterLayout({ character, characterId, isEditMode }: CharacterLayoutProps) {
  return (
    <div className="w-full">
      <Tabs defaultValue="basicos" className="w-full">
        {/* Navegação de Tabs Fixa */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="container mx-auto px-4">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 my-4">
              <TabsTrigger value="basicos" className="text-sm">
                Dados Básicos
              </TabsTrigger>
              <TabsTrigger value="pericias" className="text-sm">
                Perícias & Kit
              </TabsTrigger>
              <TabsTrigger value="magias" className="text-sm">
                Magias & Talentos
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="pt-6">
          <TabsContent value="basicos" className="mt-0">
            <BasicInfoTab character={character} characterId={characterId} isEditMode={isEditMode} />
          </TabsContent>

          <TabsContent value="pericias" className="mt-0">
            <SkillsKitTab character={character} characterId={characterId} isEditMode={isEditMode} />
          </TabsContent>

          <TabsContent value="magias" className="mt-0">
            <SpellsTalentsTab character={character} characterId={characterId} isEditMode={isEditMode} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}