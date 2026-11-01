"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCharacters, useDeleteCharacter } from '@/lib/api/queries'
import { Button } from '@/components/ui/button'
import { PageState, SkeletonBlock } from '@/components/ui/page-state'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
    Plus,
    Search,
    Trash2,
    LoaderCircle,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    CloudOff,
    ScrollText
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function CharactersPage() {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const limit = 12

    // React Query para buscar personagens
    const {
        data: charactersResponse,
        isLoading,
        error,
        refetch
    } = useCharacters({ page, limit, search })

    // Mutation para deletar personagem
    const deleteCharacterMutation = useDeleteCharacter()

    // Handlers
    const handleCreateCharacter = () => {
        router.push('/create')
    }

    const handleViewCharacter = (id: string) => {
        router.push(`/character/${id}`)
    }

    const handleDeleteCharacter = async (id: string, name: string) => {
        try {
            await deleteCharacterMutation.mutateAsync(id)
            toast.success(`Personagem "${name}" deletado com sucesso!`)
            refetch()
        } catch {
            toast.error('Erro ao deletar personagem')
        }
    }

    const handleSearch = (value: string) => {
        setSearch(value)
        setPage(1) // Reset para primeira página ao pesquisar
    }

    const characters = charactersResponse?.characters || []
    const total = charactersResponse?.total || 0
    const totalPages = Math.ceil(total / limit)

    // Linha de contagem sob o título (o cabeçalho fica sempre montado)
    const pluralFichas = (n: number) => (n === 1 ? '1 ficha' : `${n} fichas`)
    let countLabel: string
    if (isLoading) {
        countLabel = 'Carregando fichas…'
    } else if (error) {
        countLabel = ''
    } else if (total === 0 && !search) {
        countLabel = 'Nenhuma ficha ainda'
    } else if (search) {
        countLabel = total === 1 ? '1 ficha encontrada' : `${total} fichas encontradas`
    } else {
        countLabel = pluralFichas(total)
    }

    // Janela de botões numerados (md+): até 5 páginas centradas na atual
    const maxVisible = 5
    const windowStart = Math.max(1, Math.min(totalPages - (maxVisible - 1), page - Math.floor(maxVisible / 2)))

    return (
        <div className="flex min-h-dvh flex-col">
            {/* Cabeçalho */}
            <header className="sticky top-0 z-10 border-b bg-background">
                <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3.5 px-4 pt-5 pb-3">
                    <div className="flex items-end justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                            <h1 className="m-0 font-serif text-[30px] leading-[1.1] font-semibold">Personagens</h1>
                            <span className="text-sm text-muted-foreground">{countLabel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <Button
                                onClick={handleCreateCharacter}
                                className="hidden h-11 gap-2 px-[18px] text-[15px] font-semibold md:inline-flex"
                            >
                                <Plus className="size-[18px]" aria-hidden="true" />
                                Criar personagem
                            </Button>
                        </div>
                    </div>

                    {/* Barra de Pesquisa */}
                    <label className="flex h-12 items-center gap-2.5 rounded-(--radius) border border-input bg-card px-3.5 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30">
                        <Search className="size-[18px] text-muted-foreground" aria-hidden="true" />
                        <input
                            type="search"
                            aria-label="Buscar personagens"
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Buscar por nome ou jogador"
                            className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
                        />
                    </label>
                </div>
            </header>

            {/* Corpo */}
            <div className="flex-1">
                <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2.5 px-4 pt-3 pb-4">
                    {isLoading ? (
                        <div role="status" aria-live="polite" aria-busy="true">
                            <span className="sr-only">Carregando personagens…</span>
                            <ul
                                role="list"
                                className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-2.5"
                            >
                                {[0, 1, 2, 3].map((i) => (
                                    <li
                                        key={i}
                                        aria-hidden="true"
                                        className="flex rounded-(--radius) border bg-card shadow-card"
                                    >
                                        <div className="flex flex-1 flex-col gap-2 p-4">
                                            <SkeletonBlock className="h-5 w-3/5" />
                                            <SkeletonBlock className="h-3.5 w-2/5" />
                                            <div className="flex gap-1.5">
                                                <SkeletonBlock className="h-5 w-16" />
                                                <SkeletonBlock className="h-5 w-14" />
                                            </div>
                                        </div>
                                        <div className="flex w-16 flex-col items-center justify-center gap-1">
                                            <SkeletonBlock className="h-3 w-9" />
                                            <SkeletonBlock className="size-7" />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : error ? (
                        <PageState
                            variant="error"
                            icon={CloudOff}
                            title="Erro ao carregar personagens"
                            description="Verifique a conexão ou tente de novo em instantes."
                        >
                            <Button onClick={() => refetch()} className="h-12 w-full font-semibold">
                                <RefreshCw className="size-[18px]" aria-hidden="true" />
                                Tentar de novo
                            </Button>
                        </PageState>
                    ) : characters.length === 0 ? (
                        <PageState
                            variant="empty"
                            icon={ScrollText}
                            title={search ? 'Nada encontrado' : 'Nenhum personagem ainda'}
                            description={
                                search
                                    ? <>Nenhuma ficha com “{search}”. Tente outro nome.</>
                                    : 'Crie a primeira ficha. Só precisa do nome do personagem e do jogador.'
                            }
                        />
                    ) : (
                        <>
                            {/* Lista de Personagens */}
                            <ul
                                role="list"
                                className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-2.5"
                            >
                                {characters.map((character) => {
                                    const name = character.characterName || 'Sem nome'
                                    return (
                                        <li
                                            key={character.id}
                                            className="flex items-stretch overflow-hidden rounded-(--radius) border bg-card shadow-card"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => handleViewCharacter(character.id)}
                                                className="flex min-w-0 flex-1 items-center gap-3.5 py-3.5 pr-1 pl-4 text-left outline-none hover:bg-muted/40 focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
                                            >
                                                <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                                                    <span className="truncate font-serif text-xl leading-[1.15] font-semibold">
                                                        {name}
                                                    </span>
                                                    <span className="truncate text-sm text-muted-foreground">
                                                        {character.playerName ? `${character.playerName} · ` : ''}
                                                        atualizada{' '}
                                                        {formatDistanceToNow(new Date(character.updatedAt), {
                                                            addSuffix: true,
                                                            locale: ptBR
                                                        })}
                                                    </span>
                                                    {(character.class || character.race) && (
                                                        <span className="flex flex-wrap gap-1.5">
                                                            {character.class && (
                                                                <span className="rounded-(--radius) bg-secondary px-2 py-0.5 text-[13px] text-secondary-foreground">
                                                                    {character.class}
                                                                </span>
                                                            )}
                                                            {character.race && (
                                                                <span className="rounded-(--radius) border px-2 py-0.5 text-[13px] text-muted-foreground">
                                                                    {character.race}
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                </span>
                                                <span className="flex min-w-12 flex-none flex-col items-center">
                                                    <span className="text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
                                                        Nível
                                                    </span>
                                                    <span className="font-numeric text-[30px] leading-none font-semibold text-primary tabular-nums">
                                                        {character.level}
                                                    </span>
                                                </span>
                                            </button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <button
                                                        type="button"
                                                        aria-label={`Excluir ${name}`}
                                                        className="grid w-12 flex-none place-items-center border-l text-muted-foreground outline-none hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
                                                    >
                                                        <Trash2 className="size-[18px]" aria-hidden="true" />
                                                    </button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="w-[calc(100%-2.5rem)] max-w-[400px] gap-3 bg-popover p-5 text-popover-foreground sm:max-w-[400px]">
                                                    <AlertDialogHeader className="gap-3 text-left sm:text-left">
                                                        <AlertDialogTitle className="font-serif text-[22px] leading-tight font-semibold">
                                                            Excluir {name}?
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription className="text-[15px] text-pretty">
                                                            A ficha e todas as anotações serão apagadas. Essa ação não pode ser desfeita.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="grid grid-cols-2 gap-2 pt-1.5">
                                                        <AlertDialogCancel className="h-12 w-full bg-transparent text-base font-semibold dark:bg-transparent">
                                                            Cancelar
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDeleteCharacter(character.id, character.characterName)}
                                                            className="h-12 w-full bg-destructive text-base font-bold text-destructive-foreground hover:bg-destructive/90"
                                                            disabled={deleteCharacterMutation.isPending}
                                                        >
                                                            {deleteCharacterMutation.isPending ? (
                                                                <LoaderCircle className="size-[18px] animate-ficha-spin" aria-hidden="true" />
                                                            ) : null}
                                                            Excluir
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </li>
                                    )
                                })}
                            </ul>

                            {/* Paginação */}
                            {totalPages > 1 && (
                                <nav
                                    aria-label="Paginação"
                                    className="flex items-center justify-between gap-2 pt-1.5"
                                >
                                    <Button
                                        variant="outline"
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                        className="h-11 gap-1.5 bg-transparent px-3 text-[15px] dark:bg-transparent"
                                    >
                                        <ChevronLeft className="size-[18px]" aria-hidden="true" />
                                        Anterior
                                    </Button>

                                    <span className="text-sm text-muted-foreground tabular-nums md:hidden">
                                        Página {page} de {totalPages}
                                    </span>

                                    <div className="hidden items-center gap-1 md:flex">
                                        {Array.from({ length: Math.min(maxVisible, totalPages) }, (_, i) => {
                                            const pageNum = windowStart + i
                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={pageNum === page ? 'default' : 'outline'}
                                                    size="icon"
                                                    aria-current={pageNum === page ? 'page' : undefined}
                                                    onClick={() => setPage(pageNum)}
                                                    className="size-11 font-numeric tabular-nums"
                                                >
                                                    {pageNum}
                                                </Button>
                                            )
                                        })}
                                    </div>

                                    <Button
                                        variant="outline"
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === totalPages}
                                        className="h-11 gap-1.5 bg-transparent px-3 text-[15px] dark:bg-transparent"
                                    >
                                        Próxima
                                        <ChevronRight className="size-[18px]" aria-hidden="true" />
                                    </Button>
                                </nav>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Barra inferior de criar (estreito) */}
            <div className="sticky bottom-0 z-10 border-t bg-card px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:hidden">
                <Button
                    onClick={handleCreateCharacter}
                    className="h-[52px] w-full gap-2 text-[17px] font-semibold"
                >
                    <Plus className="size-5" aria-hidden="true" />
                    Criar personagem
                </Button>
            </div>
        </div>
    )
}
