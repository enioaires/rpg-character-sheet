'use client'

import { useState } from 'react'
import { ArrowLeft, CloudOff, LoaderCircle, RefreshCw, Skull } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { PageState, SkeletonBlock } from '@/components/ui/page-state'

// mensagem lançada por fetchCharacter (lib/api/queries.ts) no 404; se mudar lá, mude aqui
const CHARACTER_NOT_FOUND_MESSAGE = 'Character not found'

export function isCharacterNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message === CHARACTER_NOT_FOUND_MESSAGE
}

type OnBack = () => void
type OnRetry = () => void | Promise<unknown>

function StateTopBar({ onBack }: { onBack: OnBack }) {
  return (
    <header className="border-b p-2">
      <div className="mx-auto flex w-full max-w-[1200px] items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label="Voltar"
          onClick={onBack}
        >
          <ArrowLeft className="size-[22px]" aria-hidden="true" />
        </Button>
      </div>
    </header>
  )
}

function RetryButton({ onRetry }: { onRetry: OnRetry }) {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <Button
      type="button"
      className="h-12 w-full font-semibold"
      disabled={isRetrying}
      onClick={handleRetry}
    >
      {isRetrying ? (
        <LoaderCircle className="size-[18px] animate-ficha-spin" aria-hidden="true" />
      ) : (
        <RefreshCw className="size-[18px]" aria-hidden="true" />
      )}
      Tentar de novo
    </Button>
  )
}

function BackToListButton({ onBack }: { onBack: OnBack }) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-12 w-full bg-transparent dark:bg-transparent"
      onClick={onBack}
    >
      Voltar para a lista
    </Button>
  )
}

// ============================================
// TELAS DE ERRO
// ============================================

export function CharacterNotFoundState({
  onBack,
  onRetry,
}: {
  onBack: OnBack
  onRetry?: OnRetry
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <StateTopBar onBack={onBack} />
      <PageState
        variant="error"
        icon={Skull}
        title="Personagem não encontrado"
        description="Esta ficha pode ter sido excluída ou o link está errado."
        className="p-6"
      >
        {onRetry ? <RetryButton onRetry={onRetry} /> : null}
        <BackToListButton onBack={onBack} />
      </PageState>
    </div>
  )
}

export function CharacterLoadErrorState({
  onBack,
  onRetry,
}: {
  onBack: OnBack
  onRetry: OnRetry
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <StateTopBar onBack={onBack} />
      <PageState
        variant="error"
        icon={CloudOff}
        title="Não foi possível carregar a ficha"
        description="Verifique a conexão ou tente de novo em instantes."
        className="p-6"
      >
        <RetryButton onRetry={onRetry} />
        <BackToListButton onBack={onBack} />
      </PageState>
    </div>
  )
}

// ============================================
// CARREGANDO
// ============================================

const SKELETON_CARD = 'mb-3 flex break-inside-avoid flex-col gap-3.5 rounded-(--radius) border bg-card p-4 shadow-card'

export function CharacterSheetSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex min-h-dvh flex-col">
      <span className="sr-only">Carregando personagem…</span>
      <div className="border-b px-4 py-3">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3">
          <SkeletonBlock className="size-8" />
          <div className="flex flex-1 flex-col gap-1.5">
            <SkeletonBlock className="h-[18px] w-3/5" />
            <SkeletonBlock className="h-3 w-[35%]" />
          </div>
        </div>
      </div>
      <div className="border-b px-4 py-2.5">
        <div className="mx-auto grid max-w-[720px] grid-cols-4 gap-2">
          <SkeletonBlock pulse={false} className="h-6" />
          <SkeletonBlock pulse={false} className="h-6" />
          <SkeletonBlock pulse={false} className="h-6" />
          <SkeletonBlock pulse={false} className="h-6" />
        </div>
      </div>
      <div className="flex-1 p-3">
        <div className="mx-auto max-w-[1200px] columns-[340px] gap-3">
          <div className={`${SKELETON_CARD} h-[230px]`} aria-hidden="true">
            <SkeletonBlock className="h-[18px] w-2/5" />
            <SkeletonBlock className="h-12 w-[70%]" />
            <SkeletonBlock pulse={false} className="h-2.5" />
            <SkeletonBlock className="h-3.5 w-[90%]" />
            <SkeletonBlock className="h-3.5 w-4/5" />
          </div>
          <div className={`${SKELETON_CARD} h-[150px]`} aria-hidden="true">
            <SkeletonBlock className="h-[18px] w-[30%]" />
            <SkeletonBlock className="h-9 w-1/2" />
          </div>
        </div>
      </div>
      <div className="h-[118px] border-t bg-card" aria-hidden="true" />
    </div>
  )
}
