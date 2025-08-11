// components/character/types.ts

export interface CharacterTabProps {
  character: any
  characterId: string
  isEditMode: boolean
  isSkillsModalOpen?: boolean
  setIsSkillsModalOpen?: (open: boolean) => void
  isAttributesModalOpen?: boolean
  setIsAttributesModalOpen?: (open: boolean) => void
}

