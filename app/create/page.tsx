"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateCharacter } from '@/lib/api/queries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Loader2, User } from 'lucide-react'
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
    } catch (error) {
      toast.error('Erro ao criar personagem')
    }
  }

  const handleBack = () => {
    router.push('/characters')
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 sm:mb-8">
        <Button onClick={handleBack} variant="outline" size="sm" className="w-fit">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Criar Novo Personagem</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Preencha as informações básicas do seu personagem
          </p>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Informações Básicas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Essenciais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="characterName">
                  Nome do Personagem *
                </Label>
                <Input
                  id="characterName"
                  value={formData.characterName}
                  onChange={(e) => handleInputChange('characterName', e.target.value)}
                  placeholder="Digite o nome do personagem"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="playerName">Nome do Jogador</Label>
                <Input
                  id="playerName"
                  value={formData.playerName}
                  onChange={(e) => handleInputChange('playerName', e.target.value)}
                  placeholder="Digite o nome do jogador"
                />
              </div>
            </div>

            {/* Classe e Raça */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Classe</Label>
                <Input
                  id="class"
                  value={formData.class}
                  onChange={(e) => handleInputChange('class', e.target.value)}
                  placeholder="Ex: Guerreiro, Mago, Ladino..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="race">Raça</Label>
                <Input
                  id="race"
                  value={formData.race}
                  onChange={(e) => handleInputChange('race', e.target.value)}
                  placeholder="Ex: Humano, Elfo, Anão..."
                />
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deity">Divindade</Label>
                <Input
                  id="deity"
                  value={formData.deity}
                  onChange={(e) => handleInputChange('deity', e.target.value)}
                  placeholder="Divindade adorada"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="homeland">Terra Natal</Label>
                <Input
                  id="homeland"
                  value={formData.homeland}
                  onChange={(e) => handleInputChange('homeland', e.target.value)}
                  placeholder="Local de origem"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alignment">Tendência</Label>
                <Input
                  id="alignment"
                  value={formData.alignment}
                  onChange={(e) => handleInputChange('alignment', e.target.value)}
                  placeholder="Ex: Leal e Bom, Neutro..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gênero</Label>
                <Input
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  placeholder="Gênero do personagem"
                />
              </div>
            </div>

            {/* Características Físicas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Ex: 25 anos"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Peso</Label>
                <Input
                  id="weight"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  placeholder="Ex: 70kg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height">Altura</Label>
                <Input
                  id="height"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  placeholder="Ex: 1,75m"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1 order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createCharacterMutation.isPending || !formData.characterName.trim()}
                className="flex-1 order-1 sm:order-2"
              >
                {createCharacterMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Personagem'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Nota */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Nota:</strong> Você pode preencher apenas o nome do personagem agora e 
          completar as outras informações depois na ficha do personagem. Todos os campos 
          podem ser editados posteriormente.
        </p>
      </div>
    </div>
  )
}