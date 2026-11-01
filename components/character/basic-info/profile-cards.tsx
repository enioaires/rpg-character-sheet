// components/character/basic-info/profile-cards.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditableField, EditableNumberField } from '@/components/ui/editable-field'
import { getXPRequiredForNextLevel } from '@/lib/calculations'

import type { CharacterTabProps } from '../types'

type BasicDetailsCardProps = Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'>

export function BasicDetailsCard({ character, characterId, isEditMode }: BasicDetailsCardProps) {
  const {
    playerName, characterName, class: charClass, race, deity,
    homeland, alignment, gender, age, weight, height, virtuePoints,
  } = character

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Básicas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <EditableField
            characterId={characterId}
            section="basic"
            field="characterName"
            value={characterName}
            label="Nome do Personagem"
            placeholder="Digite o nome do personagem"
            isEditMode={isEditMode}
          />

          <EditableField
            characterId={characterId}
            section="basic"
            field="playerName"
            value={playerName}
            label="Jogador"
            placeholder="Digite o nome do jogador"
            isEditMode={isEditMode}
          />

          <EditableField
            characterId={characterId}
            section="basic"
            field="class"
            value={charClass}
            label="Classe"
            placeholder="Digite a classe"
            isEditMode={isEditMode}
          />

          <EditableField
            characterId={characterId}
            section="basic"
            field="race"
            value={race}
            label="Raça"
            placeholder="Digite a raça"
            isEditMode={isEditMode}
          />

          <EditableField
            characterId={characterId}
            section="basic"
            field="deity"
            value={deity}
            label="Divindade"
            placeholder="Digite a divindade"
            isEditMode={isEditMode}
          />

          <EditableField
            characterId={characterId}
            section="basic"
            field="homeland"
            value={homeland}
            label="Terra Natal"
            placeholder="Digite a terra natal"
            isEditMode={isEditMode}
          />

          <EditableField
            characterId={characterId}
            section="basic"
            field="alignment"
            value={alignment}
            label="Tendência"
            placeholder="Digite a tendência"
            isEditMode={isEditMode}
          />

          <EditableField
            characterId={characterId}
            section="basic"
            field="gender"
            value={gender}
            label="Gênero"
            placeholder="Digite o gênero"
            isEditMode={isEditMode}
          />

          <EditableField
            characterId={characterId}
            section="basic"
            field="age"
            value={age}
            label="Idade"
            placeholder="Digite a idade"
            isEditMode={isEditMode}
          />

          <EditableField
            characterId={characterId}
            section="basic"
            field="weight"
            value={weight}
            label="Peso"
            placeholder="Digite o peso"
            isEditMode={isEditMode}
          />

          <EditableField
            characterId={characterId}
            section="basic"
            field="height"
            value={height}
            label="Altura"
            placeholder="Digite a altura"
            isEditMode={isEditMode}
          />

          <EditableField
            characterId={characterId}
            section="basic"
            field="virtuePoints"
            value={virtuePoints}
            label="Pontos de Virtude"
            placeholder="Digite os pontos de virtude"
            isEditMode={isEditMode}
          />
        </div>
      </CardContent>
    </Card>
  )
}

type ExperienceCardProps = Pick<CharacterTabProps, 'character' | 'characterId' | 'isEditMode'>

export function ExperienceCard({ character, characterId, isEditMode }: ExperienceCardProps) {
  const {
    level, currentXP,
  } = character

  return (
    <Card>
      <CardHeader>
        <CardTitle>Experiência e Nível</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Nível Atual</label>
            <div className="text-2xl font-bold text-primary">
              <EditableNumberField
                characterId={characterId}
                section="basic"
                field="level"
                value={level || 0}
                min={0}
                max={99}
                className="text-center"
                displayClassName="text-2xl font-bold text-primary"
                isEditMode={isEditMode}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">XP Atual</label>
            <div className="text-lg font-medium">
              <EditableNumberField
                characterId={characterId}
                section="basic"
                field="currentXP"
                value={currentXP || 0}
                className="text-center"
                displayClassName="text-lg font-medium"
                isEditMode={isEditMode}
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">XP para Próximo</label>
            <div className="text-lg font-medium text-muted-foreground">
              {getXPRequiredForNextLevel(level || 0)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
