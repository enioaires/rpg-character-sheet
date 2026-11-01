import { useUpdateCharacter } from '@/lib/api/queries'

import { CharacterTabProps } from './types'
import { SpellsCard } from './spells-talents/spells-card'
import { TalentsCard } from './spells-talents/talents-card'

type SpellsTalentsTabProps = CharacterTabProps

export function SpellsTalentsTab({ character, characterId, isEditMode }: SpellsTalentsTabProps) {
  const updateCharacterMutation = useUpdateCharacter()

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SpellsCard
          character={character}
          characterId={characterId}
          isEditMode={isEditMode}
          updateCharacterMutation={updateCharacterMutation}
        />
        <TalentsCard
          character={character}
          characterId={characterId}
          isEditMode={isEditMode}
          updateCharacterMutation={updateCharacterMutation}
        />
      </div>
    </div>
  )
}
