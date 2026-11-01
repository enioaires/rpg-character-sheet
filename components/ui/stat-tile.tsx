import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type StatTileProps = Omit<ComponentProps<'div'>, 'children'> & {
  label: ReactNode
  value: ReactNode
  // 'tile': caixa com borda e fundo (atributos). 'bare': sem moldura, para faixas segmentadas
  variant?: 'tile' | 'bare'
  align?: 'start' | 'center'
  valueClassName?: string
}

export function StatTile({
  label,
  value,
  variant = 'tile',
  align = 'start',
  className,
  valueClassName,
  ...divProps
}: StatTileProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-0.5 px-2.5 py-2',
        variant === 'tile' && 'rounded-(--radius) border bg-muted',
        align === 'center' && 'items-center text-center',
        className
      )}
      {...divProps}
    >
      <span className="truncate text-[13px] text-muted-foreground">{label}</span>
      <span
        className={cn(
          'font-numeric text-2xl font-semibold leading-[1.1] tabular-nums',
          valueClassName
        )}
      >
        {value}
      </span>
    </div>
  )
}
