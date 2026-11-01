// components/character/basic-info/languages-card.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { EditableField } from '@/components/ui/editable-field'
import { STANDARD_LANGUAGES } from '@/lib/constants/character'

import type { CustomLanguage } from '@/lib/schemas/character'
import type { CharacterTabProps, UpdateCharacterMutation } from '../types'

interface LanguagesCardProps extends Pick<CharacterTabProps, 'character' | 'characterId'> {
  updateCharacterMutation: UpdateCharacterMutation
}

export function LanguagesCard({ character, characterId, updateCharacterMutation }: LanguagesCardProps) {
  const {
    languages = {},
  } = character

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linguagens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-3">Linguagens Padrão</h4>
          <div className="grid grid-cols-2 gap-3">
            {STANDARD_LANGUAGES.map((lang) => {
              const known = languages.standard?.[lang] || false

              const handleLanguageChange = async (checked: boolean) => {
                try {
                  const updateData = {
                    languages: {
                      ...languages,
                      standard: {
                        ...languages.standard,
                        [lang]: checked
                      }
                    }
                  }
                  await updateCharacterMutation.mutateAsync({
                    id: characterId,
                    data: updateData
                  })
                } catch (error) {
                  console.error('Erro ao atualizar linguagem:', error)
                }
              }

              return (
                <div key={lang} className="flex items-center space-x-2">
                  <Checkbox
                    id={`lang-${lang}`}
                    checked={known}
                    onCheckedChange={handleLanguageChange}
                    disabled={updateCharacterMutation.isPending}
                  />
                  <label
                    htmlFor={`lang-${lang}`}
                    className="text-sm font-medium capitalize cursor-pointer"
                  >
                    {lang}
                  </label>
                </div>
              )
            })}
          </div>
        </div>

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Linguagens Customizadas</h4>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const newCustomLanguages = [...(languages.custom || []), { name: '', known: false }]
                  const updateData = {
                    languages: {
                      ...languages,
                      custom: newCustomLanguages
                    }
                  }
                  await updateCharacterMutation.mutateAsync({
                    id: characterId,
                    data: updateData
                  })
                } catch (error) {
                  console.error('Erro ao adicionar linguagem:', error)
                }
              }}
            >
              + Adicionar
            </Button>
          </div>

          {languages.custom && languages.custom.length > 0 ? (
            <div className="space-y-2">
              {languages.custom.map((lang: CustomLanguage, index: number) => {
                const handleCustomLanguageChange = async (checked: boolean) => {
                  try {
                    const updatedCustom = [...languages.custom]
                    updatedCustom[index] = { ...updatedCustom[index], known: checked }

                    const updateData = {
                      languages: {
                        ...languages,
                        custom: updatedCustom
                      }
                    }
                    await updateCharacterMutation.mutateAsync({
                      id: characterId,
                      data: updateData
                    })
                  } catch (error) {
                    console.error('Erro ao atualizar linguagem customizada:', error)
                  }
                }

                return (
                  <div key={index} className="flex items-center gap-2">
                    <Checkbox
                      id={`custom-lang-${index}`}
                      checked={lang.known || false}
                      onCheckedChange={handleCustomLanguageChange}
                      disabled={updateCharacterMutation.isPending}
                    />
                    <div className="flex-1">
                      <EditableField
                        characterId={characterId}
                        currentCharacterData={character}
                        section="languages"
                        field={`custom.${index}.name`}
                        value={lang.name}
                        placeholder="Nome da linguagem"
                        className="text-sm"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma linguagem customizada. Clique em &quot;Adicionar&quot; para criar uma.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
