// components/character/skills-kit/finances-card.tsx
// Card Finanças: cinco tiles editáveis. O data-section "finances" é mantido (alvo de navegação).
import { Coins } from 'lucide-react'

import { EditableNumberField } from '@/components/ui/editable-field'
import { SectionCard } from '@/components/ui/section-card'

import type { CharacterTabProps } from '../types'

type FinancesCardProps = Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'>

// Chaves persistidas na ordem de exibição
const CURRENCIES = [
  { field: 'ouro', label: 'Ouro' },
  { field: 'prata', label: 'Prata' },
  { field: 'cobre', label: 'Cobre' },
  { field: 'imperano', label: 'Imperano' },
  { field: 'joias', label: 'Joias' },
] as const

export function FinancesCard({ character, characterId, isEditMode }: FinancesCardProps) {
  const finances = character.finances || {}

  return (
    <SectionCard
      title="Finanças"
      data-section="finances"
      action={<Coins className="size-[18px] text-muted-foreground" aria-hidden="true" />}
    >
      <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1.5">
        {CURRENCIES.map(({ field, label }) => (
          <div
            key={field}
            className="flex flex-col gap-0.5 rounded-(--radius) border bg-muted px-2.5 py-2"
          >
            <span className="text-[13px] text-muted-foreground">{label}</span>
            <EditableNumberField
              characterId={characterId}
              currentCharacterData={character}
              section="finances"
              field={field}
              value={finances[field] || 0}
              className="w-full"
              displayClassName="text-[22px] font-semibold"
              isEditMode={isEditMode}
            />
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
