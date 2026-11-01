// components/character/basic-info-tab.tsx
// Aba Básicos: devolve os cards como fragmento (filhos diretos do fluxo em colunas do layout).
import { useUpdateCharacter } from '@/lib/api/queries'

import { CharacterTabProps } from './types'
import { BasicDetailsCard, ExperienceCard } from './basic-info/profile-cards'
import { AttributesCard } from './basic-info/attribute-cards'
import { VitalityCard } from './basic-info/vitality-card'
import { BerkanaCard } from './basic-info/berkana-card'
import { WeaponsCard, ArmorCard } from './basic-info/equipment-cards'
import { LanguagesCard } from './basic-info/languages-card'

type BasicInfoTabProps = CharacterTabProps

export function BasicInfoTab({
  character,
  characterId,
  isEditMode,
}: BasicInfoTabProps) {
  const updateCharacterMutation = useUpdateCharacter()
  const cardProps = { character, characterId, isEditMode }

  return (
    <>
      <VitalityCard {...cardProps} />
      <BerkanaCard {...cardProps} />
      <WeaponsCard {...cardProps} />
      <AttributesCard {...cardProps} />
      <ExperienceCard {...cardProps} />
      <ArmorCard {...cardProps} />
      <BasicDetailsCard {...cardProps} />
      <LanguagesCard {...cardProps} updateCharacterMutation={updateCharacterMutation} />
    </>
  )
}
