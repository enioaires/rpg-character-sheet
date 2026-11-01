'use client'

import type { ReactNode } from 'react'
import { X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type BottomSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  className?: string
  children: ReactNode
}

// Sheet de baixo do design: painel centralizado de até 480px, raio de 10px no topo.
// A cor do overlay vem da regra global em globals.css.
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  className,
  children,
}: BottomSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        // Sem descrição, desliga o aviso do Radix; com descrição mantém o vínculo padrão
        {...(description ? {} : { 'aria-describedby': undefined })}
        className={cn(
          'inset-x-0 mx-auto max-h-[88dvh] w-full max-w-[480px] gap-0 overflow-y-auto rounded-t-[10px] border border-b-0 bg-popover p-0 text-popover-foreground shadow-lg',
          // Esconde só o botão de fechar gerado pelo SheetContent (o design tem o seu)
          '[&>button:last-child]:hidden'
        )}
      >
        <div className="flex flex-col gap-3.5 px-4 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div aria-hidden="true" className="mx-auto h-1 w-10 rounded-[2px] bg-input" />

          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="font-serif text-[22px] font-semibold leading-tight">
              {title}
            </SheetTitle>
            <SheetClose asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="-mr-2.5 size-11 text-muted-foreground"
                aria-label="Fechar"
              >
                <X className="size-[22px]" aria-hidden="true" />
              </Button>
            </SheetClose>
          </div>

          {description && (
            <SheetDescription className="text-sm text-muted-foreground">
              {description}
            </SheetDescription>
          )}

          <div className={cn('flex flex-col gap-3.5', className)}>{children}</div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
