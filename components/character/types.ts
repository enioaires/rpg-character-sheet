// components/character/types.ts

import type { CharacterFull } from '@/lib/schemas/character'

// Personagem como chega no cliente: o JSON da API serializa as datas como string
export type CharacterData = Omit<CharacterFull, 'createdAt' | 'updatedAt'> & {
  createdAt: string
  updatedAt: string
}

export interface CharacterTabProps {
  character: CharacterData
  characterId: string
  isEditMode: boolean
  isSkillsModalOpen?: boolean
  setIsSkillsModalOpen?: (open: boolean) => void
  isAttributesModalOpen?: boolean
  setIsAttributesModalOpen?: (open: boolean) => void
}

