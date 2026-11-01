import type { LucideIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

export type PageStateVariant = 'empty' | 'error'

type PageStateProps = Omit<React.ComponentProps<'div'>, 'title'> & {
  icon: LucideIcon
  variant?: PageStateVariant
  title: React.ReactNode
  description?: React.ReactNode
  headingLevel?: 'h2' | 'h3'
}

// Estado de página centralizado (vazio ou erro): círculo com ícone, título serifado,
// texto de apoio e coluna de ações em children.
export function PageState({
  icon: Icon,
  variant = 'empty',
  title,
  description,
  headingLevel = 'h2',
  className,
  children,
  ...divProps
}: PageStateProps) {
  const Heading = headingLevel
  const isError = variant === 'error'

  return (
    <div
      {...divProps}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-3 px-3 py-10 text-center',
        className,
      )}
    >
      <div
        className={cn(
          'grid size-16 place-items-center rounded-full border',
          isError ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        <Icon className="size-7" aria-hidden="true" />
      </div>
      <Heading
        className={cn(
          'm-0 font-serif font-semibold',
          isError ? 'text-2xl' : 'text-[22px]',
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p
          className={cn(
            'm-0 text-[15px] text-pretty text-muted-foreground',
            isError ? 'max-w-[300px]' : 'max-w-[280px]',
          )}
        >
          {description}
        </p>
      ) : null}
      {children ? (
        <div className="flex w-full max-w-[300px] flex-col gap-2.5 pt-2">{children}</div>
      ) : null}
    </div>
  )
}

type SkeletonBlockProps = React.ComponentProps<'div'> & {
  pulse?: boolean
}

// Bloco de skeleton do design: muted com a animação ficha-pulse. O chamador passa só o tamanho.
export function SkeletonBlock({ className, pulse = true, ...divProps }: SkeletonBlockProps) {
  return (
    <div
      aria-hidden="true"
      {...divProps}
      className={cn(
        'rounded-(--radius) bg-muted',
        pulse && 'animate-ficha-pulse',
        className,
      )}
    />
  )
}
