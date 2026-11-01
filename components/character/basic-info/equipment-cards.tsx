// components/character/basic-info/equipment-cards.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditableField, EditableNumberField, EditableTextArea } from '@/components/ui/editable-field'

import type { CharacterTabProps } from '../types'

type WeaponsCardProps = Pick<CharacterTabProps, 'character' | 'characterId'>

export function WeaponsCard({ character, characterId }: WeaponsCardProps) {
  const {
    weapons = {},
  } = character

  return (
    <Card data-section="weapons">
      <CardHeader>
        <CardTitle>Armas (Máximo 3)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[0, 1, 2].map((weaponIndex) => {
            const weapon = weapons[weaponIndex.toString()] || {}

            return (
              <div key={weaponIndex} className="p-3 border rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <EditableField
                      characterId={characterId}
                      currentCharacterData={character}
                      section="weapons"
                      field={`${weaponIndex}.name`}
                      value={weapon.name}
                      placeholder={`Nome da Arma ${weaponIndex + 1}`}
                      label="Nome"
                    />
                  </div>
                  <div className="w-20">
                    <EditableNumberField
                      characterId={characterId}
                      currentCharacterData={character}
                      section="weapons"
                      field={`${weaponIndex}.level`}
                      value={weapon.level || 0}
                      label="Nível"
                      min={0}
                      max={99}
                      className="text-center"
                    />
                  </div>
                </div>

                {/* Danos */}
                <div>
                  <label className="text-xs font-medium mb-1 block">Dano</label>
                  <div className="grid grid-cols-5 gap-1">
                    <div>
                      <EditableField
                        characterId={characterId}
                        currentCharacterData={character}
                        section="weapons"
                        field={`${weaponIndex}.damage.d25`}
                        value={weapon.damage?.d25}
                        placeholder="25%"
                        className="text-center text-xs"
                      />
                      <div className="text-xs text-center text-muted-foreground">25%</div>
                    </div>
                    <div>
                      <EditableField
                        characterId={characterId}
                        currentCharacterData={character}
                        section="weapons"
                        field={`${weaponIndex}.damage.d50`}
                        value={weapon.damage?.d50}
                        placeholder="50%"
                        className="text-center text-xs"
                      />
                      <div className="text-xs text-center text-muted-foreground">50%</div>
                    </div>
                    <div>
                      <EditableField
                        characterId={characterId}
                        currentCharacterData={character}
                        section="weapons"
                        field={`${weaponIndex}.damage.d75`}
                        value={weapon.damage?.d75}
                        placeholder="75%"
                        className="text-center text-xs"
                      />
                      <div className="text-xs text-center text-muted-foreground">75%</div>
                    </div>
                    <div>
                      <EditableField
                        characterId={characterId}
                        currentCharacterData={character}
                        section="weapons"
                        field={`${weaponIndex}.damage.d100`}
                        value={weapon.damage?.d100}
                        placeholder="100%"
                        className="text-center text-xs"
                      />
                      <div className="text-xs text-center text-muted-foreground">100%</div>
                    </div>
                    <div>
                      <EditableField
                        characterId={characterId}
                        currentCharacterData={character}
                        section="weapons"
                        field={`${weaponIndex}.damage.critical`}
                        value={weapon.damage?.critical}
                        placeholder="Crítico"
                        className="text-center text-xs"
                      />
                      <div className="text-xs text-center text-muted-foreground">Crítico</div>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                <div>
                  <EditableTextArea
                    characterId={characterId}
                    currentCharacterData={character}
                    section="weapons"
                    field={`${weaponIndex}.description`}
                    value={weapon.description}
                    placeholder="Observações/Descrição da arma"
                    rows={2}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

type ArmorCardProps = Pick<CharacterTabProps, 'character' | 'characterId'>

export function ArmorCard({ character, characterId }: ArmorCardProps) {
  const {
    armor = {},
  } = character

  return (
    <Card>
      <CardHeader>
        <CardTitle>Armadura</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <EditableField
              characterId={characterId}
              currentCharacterData={character}
              section="armor"
              field="name"
              value={armor.name}
              placeholder="Nome da armadura"
              label="Nome"
            />
          </div>
          <div>
            <EditableNumberField
              characterId={characterId}
              currentCharacterData={character}
              section="armor"
              field="totalVitality"
              value={armor.totalVitality || 0}
              label="Vitalidade Total"
              className="text-center"
            />
          </div>
        </div>

        <div>
          <EditableNumberField
            characterId={characterId}
            currentCharacterData={character}
            section="armor"
            field="currentVitality"
            value={armor.currentVitality || 0}
            label="Vitalidade Atual"
            className="text-center"
          />
        </div>

        <div>
          <EditableTextArea
            characterId={characterId}
            currentCharacterData={character}
            section="armor"
            field="description"
            value={armor.description}
            placeholder="Descrição da armadura"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  )
}
