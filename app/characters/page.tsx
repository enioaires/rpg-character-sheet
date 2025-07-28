"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCharacters, useDeleteCharacter } from '@/lib/api/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
    Eye,
    Trash2,
    Loader2,
    User,
    Calendar,
    Sword
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
        } catch (error) {
            toast.error('Erro ao deletar personagem')
        }
    }

    const handleSearch = (value: string) => {
        setSearch(value)
        setPage(1) // Reset para primeira página ao pesquisar
    }

    // Estados de loading e erro
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-muted-foreground">Carregando personagens...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card className="max-w-md mx-auto">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <h2 className="text-xl font-semibold text-destructive">
                                Erro ao carregar personagens
                            </h2>
                            <p className="text-muted-foreground">
                                {error.message || 'Não foi possível carregar a lista de personagens'}
                            </p>
                            <Button onClick={() => refetch()}>
                                Tentar Novamente
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const characters = charactersResponse?.characters || []
    const total = charactersResponse?.total || 0
    const totalPages = Math.ceil(total / limit)

    return (
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Personagens</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Gerencie suas fichas de personagem de RPG
                    </p>
                </div>
                <Button onClick={handleCreateCharacter} className="w-full sm:w-auto">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Personagem
                </Button>
            </div>

            {/* Barra de Pesquisa */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                    placeholder="Pesquisar por nome do personagem ou jogador..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Lista de Personagens */}
            {characters.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Nenhum personagem encontrado</h3>
                                <p className="text-muted-foreground">
                                    {search
                                        ? 'Tente ajustar sua pesquisa ou criar um novo personagem.'
                                        : 'Comece criando seu primeiro personagem!'
                                    }
                                </p>
                            </div>
                            <Button onClick={handleCreateCharacter}>
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Primeiro Personagem
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Grid de Personagens */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                        {characters.map((character) => (
                            <Card key={character.id} className="hover:shadow-lg transition-shadow mobile-tap">
                                <CardHeader className="pb-3 mobile-card-compact">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-base sm:text-lg truncate">
                                                {character.characterName || 'Sem nome'}
                                            </CardTitle>
                                            {character.playerName && (
                                                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                                    Jogador: {character.playerName}
                                                </p>
                                            )}
                                        </div>
                                        <Badge variant="secondary" className="text-xs shrink-0">
                                            Nv. {character.level}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-3 mobile-card-compact">
                                    {/* Informações do Personagem */}
                                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                        {character.race && (
                                            <div className="flex items-center gap-2">
                                                <User className="w-3 h-3 text-muted-foreground shrink-0" />
                                                <span className="text-muted-foreground">Raça:</span>
                                                <span className="truncate">{character.race}</span>
                                            </div>
                                        )}
                                        {character.class && (
                                            <div className="flex items-center gap-2">
                                                <Sword className="w-3 h-3 text-muted-foreground shrink-0" />
                                                <span className="text-muted-foreground">Classe:</span>
                                                <span className="truncate">{character.class}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-muted-foreground shrink-0" />
                                            <span className="text-muted-foreground">Atualizado:</span>
                                            <span className="truncate">
                                                {formatDistanceToNow(new Date(character.updatedAt), {
                                                    addSuffix: true,
                                                    locale: ptBR
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Ações */}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            onClick={() => handleViewCharacter(character.id)}
                                            className="flex-1 touch-target"
                                        >
                                            <Eye className="w-3 h-3 mr-1" />
                                            <span className="hidden sm:inline">Abrir</span>
                                            <span className="sm:hidden">Ver</span>
                                        </Button>

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive touch-target"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="mx-2 sm:mx-auto max-w-md">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Deletar Personagem</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Tem certeza que deseja deletar o personagem "{character.characterName}"?
                                                        Esta ação não pode ser desfeita.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                                    <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDeleteCharacter(character.id, character.characterName)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto"
                                                        disabled={deleteCharacterMutation.isPending}
                                                    >
                                                        {deleteCharacterMutation.isPending ? (
                                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                        ) : null}
                                                        Deletar
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                className="touch-target"
                            >
                                <span className="hidden sm:inline">Anterior</span>
                                <span className="sm:hidden">Ant</span>
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(window.innerWidth < 640 ? 3 : 5, totalPages) }, (_, i) => {
                                    const maxVisible = window.innerWidth < 640 ? 3 : 5
                                    const pageNum = Math.max(1, Math.min(totalPages - (maxVisible - 1), page - Math.floor(maxVisible / 2))) + i
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={pageNum === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setPage(pageNum)}
                                            className="w-8 sm:w-10 touch-target"
                                        >
                                            {pageNum}
                                        </Button>
                                    )
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(page + 1)}
                                disabled={page === totalPages}
                                className="touch-target"
                            >
                                <span className="hidden sm:inline">Próxima</span>
                                <span className="sm:hidden">Prox</span>
                            </Button>
                        </div>
                    )}

                    {/* Informações de Paginação */}
                    <div className="text-center text-sm text-muted-foreground mt-4">
                        Mostrando {((page - 1) * limit) + 1} a {Math.min(page * limit, total)} de {total} personagens
                    </div>
                </>
            )}
        </div>
    )
}