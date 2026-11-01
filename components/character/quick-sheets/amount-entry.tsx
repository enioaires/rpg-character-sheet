'use client'

import { Input } from '@/components/ui/input'
import { formatGameNumber } from '@/components/character/resource-display'

interface AmountEntryProps {
  amount: string
  onAmountChange: (next: string) => void
  ariaLabel: string
  chips: readonly number[]
  disabled?: boolean
}

// Campo de valor e atalhos das sheets de vitalidade e Berkana.
// Os atalhos só somam ao valor digitado; nada é gravado aqui.
export function AmountEntry({ amount, onAmountChange, ariaLabel, chips, disabled = false }: AmountEntryProps) {
  const amountValue = parseInt(amount, 10) || 0

  return (
    <>
      <Input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        aria-label={ariaLabel}
        value={amount}
        disabled={disabled}
        onChange={(event) => onAmountChange(event.target.value.replace(/\D/g, ''))}
        className="h-[72px] text-center font-numeric text-[44px] font-semibold tabular-nums md:text-[44px]"
      />
      <div className="grid grid-cols-4 gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            disabled={disabled}
            onClick={() => onAmountChange(String(amountValue + chip))}
            className="h-11 rounded-(--radius) border bg-secondary font-numeric text-[17px] font-semibold tabular-nums outline-none hover:bg-secondary/80 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
          >
            +{formatGameNumber(chip)}
          </button>
        ))}
      </div>
    </>
  )
}
