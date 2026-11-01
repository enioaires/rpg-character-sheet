import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type NumericSize = 'sm' | 'md' | 'lg' | 'xl' | 'hero'

const VALUE_SIZE: Record<NumericSize, string> = {
  sm: 'text-[17px]',
  md: 'text-2xl leading-[1.1]',
  lg: 'text-[34px] leading-none',
  xl: 'text-[44px] leading-none',
  hero: 'text-[56px] leading-[0.95] tracking-[-0.01em]',
}

const MAX_SIZE: Record<NumericSize, string> = {
  sm: 'text-sm',
  md: 'text-[15px]',
  lg: 'text-lg',
  xl: 'text-xl',
  hero: 'text-[22px]',
}

type NumericDisplayProps = Omit<ComponentProps<'span'>, 'children'> & {
  value: ReactNode
  max?: ReactNode
  size?: NumericSize
  maxClassName?: string
}

// Número em Barlow Semi Condensed com tabular-nums. Não formata nem calcula:
// quem chama passa valores já derivados de lib/calculations.
export function NumericDisplay({
  value,
  max,
  size = 'md',
  className,
  maxClassName,
  ...spanProps
}: NumericDisplayProps) {
  return (
    <span
      className={cn('font-numeric font-semibold tabular-nums', VALUE_SIZE[size], className)}
      {...spanProps}
    >
      {value}
      {max !== undefined && max !== null && (
        <span className={cn('font-medium text-muted-foreground', MAX_SIZE[size], maxClassName)}>
          {' / '}
          {max}
        </span>
      )}
    </span>
  )
}
