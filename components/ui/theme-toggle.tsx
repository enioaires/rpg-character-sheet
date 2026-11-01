'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      className={cn('size-11 text-muted-foreground', className)}
      aria-label="Alternar tema claro/escuro"
      title="Alternar tema"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
    >
      <Sun className="size-5 dark:hidden" aria-hidden="true" />
      <Moon className="hidden size-5 dark:block" aria-hidden="true" />
    </Button>
  )
}
