// components/forms/character-layout.tsx
import { useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BasicInfoTab,
  SkillsKitTab,
  SpellsTalentsTab,
  NotesTab,
  type CharacterTabProps
} from '@/components/character'
import { QuickActionsBar } from '@/components/character/quick-actions-bar'
import { BerkanaSheet } from '@/components/character/quick-sheets/berkana-sheet'
import {
  QuickSheetContext,
  type QuickSheetApi,
  type QuickSheetKind
} from '@/components/character/quick-sheets/quick-sheet-context'
import {
  AttributesSheet,
  SkillsSheet,
  WeaponsSheet
} from '@/components/character/quick-sheets/reference-sheets'
import { VitalitySheet } from '@/components/character/quick-sheets/vitality-sheet'
import { useUpdateCharacter } from '@/lib/api/queries'

// ============================================
// ABAS: [valor, rótulo curto, rótulo longo]
// ============================================

const TABS = [
  ['basicos', 'Básicos', 'Dados Básicos'],
  ['pericias', 'Perícias', 'Perícias & Kit'],
  ['magias', 'Magias', 'Magias & Talentos'],
  ['anotacoes', 'Notas', 'Anotações'],
] as const

const TAB_TRIGGER_CLASS =
  'h-[46px] rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 text-[15px] font-semibold text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:text-muted-foreground dark:data-[state=active]:border-primary dark:data-[state=active]:bg-transparent dark:data-[state=active]:text-foreground'

// Conteúdo em colunas CSS: os cards entram como filhos diretos (ver 261101-mvw..mvz)
const TAB_CONTENT_CLASS =
  'mt-0 mx-auto w-full max-w-[1200px] p-3 [column-width:340px] [column-gap:12px]'

// ============================================
// COMPONENTE PRINCIPAL - COM TABS FIXAS
// ============================================

interface CharacterLayoutProps extends CharacterTabProps {
  onToggleEditMode?: () => void
  header?: React.ReactNode
}

export function CharacterLayout({ character, characterId, isEditMode, onToggleEditMode, header }: CharacterLayoutProps) {
  const [activeTab, setActiveTab] = useState('basicos')
  const [openSheet, setOpenSheet] = useState<QuickSheetKind | null>(null)
  // Única instância de useUpdateCharacter para as sheets de jogo
  const updateCharacterMutation = useUpdateCharacter()
  const quickSheetApi = useMemo<QuickSheetApi>(() => ({ openSheet: setOpenSheet }), [])

  const sheetProps = (kind: QuickSheetKind) => ({
    open: openSheet === kind,
    onOpenChange: (open: boolean) => setOpenSheet(open ? kind : null),
  })

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-background">
      <QuickSheetContext.Provider value={quickSheetApi}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col gap-0">
          {/* Topo fixo: cabeçalho, abas e faixa do modo de edição */}
          <div className="sticky top-0 z-20 border-b bg-background">
            {header}
            <TabsList className="mx-auto grid h-auto w-full max-w-[720px] grid-cols-4 rounded-none bg-transparent p-0">
              {TABS.map(([value, short, long]) => (
                <TabsTrigger key={value} value={value} className={TAB_TRIGGER_CLASS}>
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{long}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            {isEditMode && (
              <div className="flex h-[30px] items-center justify-center gap-2 bg-accent text-[13px] font-medium text-accent-foreground">
                <Pencil className="size-3.5" aria-hidden="true" />
                Modo edição · as alterações são salvas sozinhas
              </div>
            )}
          </div>

          {/* Conteúdo das Tabs */}
          <TabsContent value="basicos" className={TAB_CONTENT_CLASS}>
            <BasicInfoTab
              character={character}
              characterId={characterId}
              isEditMode={isEditMode}
              isAttributesModalOpen={openSheet === 'atributos'}
              setIsAttributesModalOpen={(open) => setOpenSheet(open ? 'atributos' : null)}
            />
          </TabsContent>

          <TabsContent value="pericias" className={TAB_CONTENT_CLASS}>
            <SkillsKitTab
              character={character}
              characterId={characterId}
              isEditMode={isEditMode}
              isSkillsModalOpen={openSheet === 'pericias'}
              setIsSkillsModalOpen={(open) => setOpenSheet(open ? 'pericias' : null)}
            />
          </TabsContent>

          <TabsContent value="magias" className={TAB_CONTENT_CLASS}>
            <SpellsTalentsTab
              character={character}
              characterId={characterId}
              isEditMode={isEditMode}
            />
          </TabsContent>

          <TabsContent value="anotacoes" className={TAB_CONTENT_CLASS}>
            <NotesTab
              character={character}
              characterId={characterId}
              isEditMode={isEditMode}
            />
          </TabsContent>

          {/* Barra de ações rápidas */}
          <QuickActionsBar
            character={character}
            isEditMode={isEditMode}
            onToggleEditMode={onToggleEditMode}
            onOpenSheet={setOpenSheet}
          />
        </Tabs>
      </QuickSheetContext.Provider>

      {/* Sheets - fora das tabs */}
      <VitalitySheet
        {...sheetProps('vit')}
        character={character}
        characterId={characterId}
        isEditMode={isEditMode}
        updateCharacterMutation={updateCharacterMutation}
      />
      <BerkanaSheet
        {...sheetProps('berk')}
        character={character}
        characterId={characterId}
        isEditMode={isEditMode}
        updateCharacterMutation={updateCharacterMutation}
      />
      <WeaponsSheet {...sheetProps('arma')} character={character} />
      <AttributesSheet {...sheetProps('atributos')} character={character} />
      <SkillsSheet {...sheetProps('pericias')} character={character} />
    </div>
  )
}
