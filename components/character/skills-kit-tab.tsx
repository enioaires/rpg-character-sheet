// components/character/skills-kit-tab.tsx
// Aba Perícias e Kit: devolve os cards como fragmento (filhos diretos do fluxo em colunas do layout).
// Uma única mutação alimenta os passos das perícias e as ações do kit; os campos digitados
// usam a própria instância de EditableField, e a fila por personagem serializa todas as gravações.
import { useUpdateCharacter } from '@/lib/api/queries'

import { CharacterTabProps } from './types'
import { SkillsCard } from './skills-kit/skills-card'
import { FinancesCard } from './skills-kit/finances-card'
import { AdventureKitCard } from './skills-kit/adventure-kit-card'

type SkillsKitTabProps = CharacterTabProps

export function SkillsKitTab({
  character,
  characterId,
  isEditMode,
  setIsSkillsModalOpen,
}: SkillsKitTabProps) {
  const updateCharacterMutation = useUpdateCharacter()
  const cardProps = { character, characterId, isEditMode }

  return (
    <>
      <SkillsCard
        {...cardProps}
        updateCharacterMutation={updateCharacterMutation}
        onOpenSkillsOverview={
          setIsSkillsModalOpen ? () => setIsSkillsModalOpen(true) : undefined
        }
      />
      <FinancesCard {...cardProps} />
      <AdventureKitCard {...cardProps} updateCharacterMutation={updateCharacterMutation} />
    </>
  )
}
