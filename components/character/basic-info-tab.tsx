// components/character/BasicInfoTab.tsx
import { useUpdateCharacter } from '@/lib/api/queries'

import { CharacterTabProps } from './types'
import { BasicDetailsCard, ExperienceCard } from './basic-info/profile-cards'
import { AttributesSummaryCard, AttributesDistributionCard } from './basic-info/attribute-cards'
import { VitalityCard } from './basic-info/vitality-card'
import { BerkanaCard } from './basic-info/berkana-card'
import { WeaponsCard, ArmorCard } from './basic-info/equipment-cards'
import { LanguagesCard } from './basic-info/languages-card'

type BasicInfoTabProps = CharacterTabProps

export function BasicInfoTab({ 
  character, 
  characterId, 
  isEditMode, 
  setIsAttributesModalOpen 
}: BasicInfoTabProps) {
  const updateCharacterMutation = useUpdateCharacter()
  const cardProps = { character, characterId, isEditMode }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BasicDetailsCard {...cardProps} />
        <ExperienceCard {...cardProps} />
      </div>

      {/* Segunda linha - Atributos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttributesSummaryCard {...cardProps} setIsAttributesModalOpen={setIsAttributesModalOpen} />
        <AttributesDistributionCard {...cardProps} />
      </div>

      {/* Terceira linha - Vitalidade e Berkana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VitalityCard {...cardProps} updateCharacterMutation={updateCharacterMutation} />
        <BerkanaCard {...cardProps} updateCharacterMutation={updateCharacterMutation} />
      </div>

      {/* Quarta linha - Armas e Armadura */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeaponsCard {...cardProps} />
        <ArmorCard {...cardProps} />
      </div>

      {/* Quinta linha - Linguagens */}
      <LanguagesCard {...cardProps} updateCharacterMutation={updateCharacterMutation} />
    </div>
  )
}
