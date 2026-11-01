// components/character/spells-talents-tab.tsx
// Aba Magias e Talentos: alternância entre as duas listas. Devolve um fragmento de filhos
// diretos do fluxo em colunas do layout; a alternância e a barra ocupam todas as colunas.
// Uma única mutação é compartilhada pelas duas listas.
import { useState } from 'react'
import { Award, Sparkles } from 'lucide-react'

import { useUpdateCharacter } from '@/lib/api/queries'
import { cn } from '@/lib/utils'
import type { MagicView } from '@/lib/spells-talents'

import { CharacterTabProps } from './types'
import { SpellsCard } from './spells-talents/spells-card'
import { TalentsCard } from './spells-talents/talents-card'

type SpellsTalentsTabProps = CharacterTabProps

const VIEW_BUTTON =
  'flex h-[42px] items-center justify-center gap-2 rounded-(--radius) text-[15px] font-semibold'

export function SpellsTalentsTab({ character, characterId, isEditMode }: SpellsTalentsTabProps) {
  const updateCharacterMutation = useUpdateCharacter()
  // Qual lista aparece: só estado de tela, nunca gravado
  const [view, setView] = useState<MagicView>('magias')

  const spellCount = Array.isArray(character.spells) ? character.spells.length : 0
  const talentCount = Array.isArray(character.talents) ? character.talents.length : 0

  const tabs: { key: MagicView; label: string; icon: typeof Sparkles }[] = [
    { key: 'magias', label: `Magias · ${spellCount}`, icon: Sparkles },
    { key: 'talentos', label: `Talentos · ${talentCount}`, icon: Award },
  ]

  const listProps = { character, characterId, isEditMode, updateCharacterMutation }

  return (
    <>
      <div className="mb-2.5 grid max-w-[720px] grid-cols-2 rounded-(--radius) bg-muted p-[3px] [column-span:all]">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            aria-pressed={view === key}
            onClick={() => setView(key)}
            className={cn(
              VIEW_BUTTON,
              view === key
                ? 'bg-card text-foreground shadow-card'
                : 'bg-transparent text-muted-foreground'
            )}
          >
            <Icon aria-hidden="true" className="size-4" />
            {label}
          </button>
        ))}
      </div>
      {view === 'magias' ? (
        <SpellsCard key="magias" {...listProps} />
      ) : (
        <TalentsCard key="talentos" {...listProps} />
      )}
    </>
  )
}
