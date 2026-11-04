// Trava a compatibilidade de currentVitality e vitality na edição inline: um campo simples
// mescla a seção existente (chaves antigas de estágio e desconhecidas sobrevivem) e só
// altera o campo editado. O PUT grava a coluna Json inteira, então isso evita perda de dados.
//
// ATENÇÃO: mock.module do bun vale para o processo inteiro; segue o mesmo padrão de
// components/character/basic-info-tab.render.test.ts.

import { describe, expect, it, mock } from 'bun:test'

const useUpdateCharacter = mock(() => ({
  mutateAsync: mock(async () => ({})),
  isPending: false,
  error: null,
}))

mock.module('@/lib/api/queries', () => ({ useUpdateCharacter }))

describe('buildUpdateData: vitalidade', () => {
  it('currentVitality.current mescla as chaves antigas e desconhecidas', async () => {
    const { buildUpdateData } = await import('@/components/ui/editable-field')

    expect(
      buildUpdateData('currentVitality', 'current', 4000, {
        currentVitality: { notavel: 0, ferido: 1000, extra: 'x' },
      }),
    ).toEqual({ currentVitality: { notavel: 0, ferido: 1000, extra: 'x', current: 4000 } })
  })

  it('vitality.perLevel mescla race e class', async () => {
    const { buildUpdateData } = await import('@/components/ui/editable-field')

    expect(buildUpdateData('vitality', 'perLevel', 650, { vitality: { race: 3500, class: 3500 } })).toEqual({
      vitality: { race: 3500, class: 3500, perLevel: 650 },
    })
  })

  it('sem a seção no personagem grava só o campo editado', async () => {
    const { buildUpdateData } = await import('@/components/ui/editable-field')

    expect(buildUpdateData('currentVitality', 'current', 4000, {})).toEqual({ currentVitality: { current: 4000 } })
  })
})
