// Testes de pureza de render do NotesTab (BUG-02): renderizar nunca grava nem migra.
//
// renderToString não executa efeitos e não há ambiente DOM instalado, então o
// comportamento de efeito (migração única sob Strict Mode) é verificado só à mão.
//
// ATENÇÃO: mock.module do bun vale para o processo inteiro do `bun test`. Este
// arquivo substitui '@/lib/api/queries' para todos os arquivos de teste da mesma
// execução; um teste futuro que precise do módulo real deve levar isso em conta.

import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'

const mutateAsync = mock(async (_variables?: unknown) => ({}))
const useUpdateCharacter = mock(() => ({
  mutateAsync,
  isPending: false,
  error: null,
}))

mock.module('@/lib/api/queries', () => ({ useUpdateCharacter }))

type Props = { notes: unknown; isEditMode: boolean }

async function render({ notes, isEditMode }: Props): Promise<string> {
  const { NotesTab } = await import('./notes-tab')
  return renderToString(
    createElement(NotesTab, {
      character: { notes },
      characterId: 'test-char',
      isEditMode,
    }),
  )
}

const LEGACY_TEXT = 'Texto antigo do personagem'
const MALFORMED_JSON = '[{"id":'
const VALID_NOTES = JSON.stringify([
  {
    id: '1',
    title: 'Titulo de Teste',
    content: 'Conteudo de teste',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
])

beforeEach(() => {
  useUpdateCharacter.mockClear()
  mutateAsync.mockClear()
})

describe('NotesTab render purity', () => {
  it('A: texto antigo em modo de edicao nao dispara migracao durante o render', async () => {
    await render({ notes: LEGACY_TEXT, isEditMode: true })
    expect(mutateAsync).toHaveBeenCalledTimes(0)
  })

  it('B: array JSON valido renderiza o titulo e nao grava', async () => {
    const html = await render({ notes: VALID_NOTES, isEditMode: true })
    expect(html).toContain('Titulo de Teste')
    expect(mutateAsync).toHaveBeenCalledTimes(0)
  })

  it('C: texto antigo fora do modo de edicao nao grava', async () => {
    await render({ notes: LEGACY_TEXT, isEditMode: false })
    expect(mutateAsync).toHaveBeenCalledTimes(0)
  })
})
