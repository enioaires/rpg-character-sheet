import type { ComponentProps, ReactNode } from 'react'

import { cn } from '@/lib/utils'

// ============================================
// CARD DE SEÇÃO (design Ferro & Brasa)
// ============================================

export type SectionMarkerTone = 'primary' | 'berkana'

// Losango de 7px que abre o título de cada card
export function DiamondMarker({
  tone = 'primary',
  className,
}: {
  tone?: SectionMarkerTone
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'size-[7px] shrink-0 rotate-45',
        tone === 'berkana' ? 'bg-berkana' : 'bg-primary',
        className
      )}
    />
  )
}

// Losango + título em serifa. Também serve fora de um card (ex.: grupos de magias)
export function SectionTitle({
  children,
  tone = 'primary',
  headingLevel: Heading = 'h2',
  className,
}: {
  children: ReactNode
  tone?: SectionMarkerTone
  headingLevel?: 'h2' | 'h3'
  className?: string
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <DiamondMarker tone={tone} />
      <Heading className="m-0 font-serif text-[19px] font-semibold leading-tight">
        {children}
      </Heading>
    </div>
  )
}

type SectionCardProps = Omit<ComponentProps<'section'>, 'title'> & {
  title: ReactNode
  tone?: SectionMarkerTone
  // Badge, status, ícone ou botão pequeno à direita do título
  action?: ReactNode
  headingLevel?: 'h2' | 'h3'
}

export function SectionCard({
  title,
  tone,
  action,
  headingLevel,
  className,
  children,
  ...sectionProps
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'mb-3 flex break-inside-avoid flex-col gap-3.5 rounded-(--radius) border bg-card p-4 text-card-foreground shadow-card',
        className
      )}
      {...sectionProps}
    >
      <div className="flex items-center justify-between gap-2">
        <SectionTitle tone={tone} headingLevel={headingLevel}>
          {title}
        </SectionTitle>
        {action}
      </div>
      {children}
    </section>
  )
}
