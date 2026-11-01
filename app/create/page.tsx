"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateCharacter } from '@/lib/api/queries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, ChevronDown, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function CreateCharacterPage() {
  const router = useRouter()
  const createCharacterMutation = useCreateCharacter()
  
  const [formData, setFormData] = useState({
    characterName: '',
    playerName: '',
    class: '',
    race: '',
    deity: '',
    homeland: '',
    alignment: '',
    gender: '',
    age: '',
    weight: '',
    height: '',
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.characterName.trim()) {
      toast.error('Nome do personagem é obrigatório')
      return
    }

    try {
      const response = await createCharacterMutation.mutateAsync(formData)
      toast.success('Personagem criado com sucesso!')
      router.push(`/character/${response.character.id}`)
    } catch {
      toast.error('Erro ao criar personagem')
    }
  }

  const handleBack = () => {
    router.push('/characters')
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-1 p-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Voltar"
            onClick={handleBack}
          >
            <ArrowLeft className="size-[22px]" aria-hidden="true" />
          </Button>
          <h1 className="font-serif text-xl font-semibold">Novo personagem</h1>
        </div>
      </header>

      {/* Formulário */}
      <div className="flex flex-1 justify-center px-4 py-6">
        <form onSubmit={handleSubmit} className="flex w-full max-w-[440px] flex-col gap-[22px]">
          <p className="m-0 text-[15px] text-pretty text-muted-foreground">
            Comece pelo nome. Atributos, perícias e o resto da ficha você preenche depois, direto na ficha.
          </p>

          <div className="flex flex-col gap-2">
            <Label htmlFor="characterName" className="text-sm font-semibold">Nome do personagem</Label>
            <Input
              id="characterName"
              value={formData.characterName}
              onChange={(e) => handleInputChange('characterName', e.target.value)}
              placeholder="Digite o nome do personagem"
              required
              className="h-[52px] bg-card px-3.5 text-[17px] dark:bg-card md:text-[17px]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="playerName" className="text-sm font-semibold">Nome do jogador</Label>
            <Input
              id="playerName"
              value={formData.playerName}
              onChange={(e) => handleInputChange('playerName', e.target.value)}
              placeholder="Digite o nome do jogador"
              className="h-[52px] bg-card px-3.5 text-[17px] dark:bg-card md:text-[17px]"
            />
          </div>

          <details className="group rounded-(--radius) border">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3.5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
              Mais detalhes (opcional)
              <ChevronDown
                className="size-[18px] text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="grid grid-cols-1 gap-3.5 border-t p-3.5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="class" className="text-sm font-semibold">Classe</Label>
                <Input
                  id="class"
                  value={formData.class}
                  onChange={(e) => handleInputChange('class', e.target.value)}
                  placeholder="Ex: Guerreiro, Mago, Ladino..."
                  className="h-12 bg-card text-base dark:bg-card md:text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="race" className="text-sm font-semibold">Raça</Label>
                <Input
                  id="race"
                  value={formData.race}
                  onChange={(e) => handleInputChange('race', e.target.value)}
                  placeholder="Ex: Humano, Elfo, Anão..."
                  className="h-12 bg-card text-base dark:bg-card md:text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="deity" className="text-sm font-semibold">Divindade</Label>
                <Input
                  id="deity"
                  value={formData.deity}
                  onChange={(e) => handleInputChange('deity', e.target.value)}
                  placeholder="Divindade adorada"
                  className="h-12 bg-card text-base dark:bg-card md:text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="homeland" className="text-sm font-semibold">Terra natal</Label>
                <Input
                  id="homeland"
                  value={formData.homeland}
                  onChange={(e) => handleInputChange('homeland', e.target.value)}
                  placeholder="Local de origem"
                  className="h-12 bg-card text-base dark:bg-card md:text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="alignment" className="text-sm font-semibold">Tendência</Label>
                <Input
                  id="alignment"
                  value={formData.alignment}
                  onChange={(e) => handleInputChange('alignment', e.target.value)}
                  placeholder="Ex: Leal e Bom, Neutro..."
                  className="h-12 bg-card text-base dark:bg-card md:text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="gender" className="text-sm font-semibold">Gênero</Label>
                <Input
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  placeholder="Gênero do personagem"
                  className="h-12 bg-card text-base dark:bg-card md:text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="age" className="text-sm font-semibold">Idade</Label>
                <Input
                  id="age"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Ex: 25 anos"
                  className="h-12 bg-card text-base dark:bg-card md:text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="weight" className="text-sm font-semibold">Peso</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="Ex: 70kg"
                  className="h-12 bg-card text-base dark:bg-card md:text-base"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="height" className="text-sm font-semibold">Altura</Label>
                <Input
                  id="height"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  placeholder="Ex: 1,75m"
                  className="h-12 bg-card text-base dark:bg-card md:text-base"
                />
              </div>
            </div>
          </details>

          <div className="flex flex-col gap-2.5 pt-1.5">
            <Button
              type="submit"
              disabled={createCharacterMutation.isPending || !formData.characterName.trim()}
              className="h-[52px] w-full text-[17px] font-semibold"
            >
              {createCharacterMutation.isPending ? (
                <>
                  <LoaderCircle className="size-5 animate-ficha-spin" aria-hidden="true" />
                  Criando...
                </>
              ) : (
                'Criar personagem'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="h-12 w-full bg-transparent text-base dark:bg-transparent"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
