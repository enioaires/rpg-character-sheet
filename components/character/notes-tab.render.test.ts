// Testes de pureza de render do NotesTab (BUG-02): renderizar nunca grava nem migra.
//
// renderToString não executa efeitos e não há ambiente DOM instalado, então o
// comportamento de efeito (migração única sob Strict Mode) é verificado só à mão.
//
// ATENÇÃO: mock.module do bun vale para o processo inteiro do `bun test`. Este
// arquivo substitui '@/lib/api/queries' para todos os arquivos de teste da mesma
// execução; um teste futuro que precise do módulo real deve levar isso em conta.

import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import type { CharacterData } from './types'

const mutateAsync = mock(async () => ({}))
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
      // Só `notes` importa para este componente; o resto do personagem não é lido
      character: { notes } as unknown as CharacterData,
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

  it('D: nenhum console log/info/debug e nenhuma gravacao', async () => {
    const spies = (['log', 'info', 'debug'] as const).map((method) =>
      spyOn(console, method).mockImplementation(() => {}),
    )
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
    try {
      await render({ notes: MALFORMED_JSON, isEditMode: true })
      await render({ notes: LEGACY_TEXT, isEditMode: true })
      for (const spy of spies) {
        expect(spy).toHaveBeenCalledTimes(0)
      }
      expect(mutateAsync).toHaveBeenCalledTimes(0)
    } finally {
      for (const spy of spies) spy.mockRestore()
      errorSpy.mockRestore()
    }
  })

  it('E: JSON malformado renderiza sem lancar, sem gravar e em uma unica passada', async () => {
    const errorSpy = spyOn(console, 'error').mockImplementation(() => {})
    try {
      for (const isEditMode of [true, false]) {
        useUpdateCharacter.mockClear()
        const html = await render({ notes: MALFORMED_JSON, isEditMode })
        expect(html.length).toBeGreaterThan(0)
        expect(mutateAsync).toHaveBeenCalledTimes(0)
        expect(useUpdateCharacter).toHaveBeenCalledTimes(1)
      }
    } finally {
      errorSpy.mockRestore()
    }
  })
})

describe('NotesTab dados corrompidos ou em formato antigo', () => {
  const CREATE_CONTROLS = [
    'Nenhuma anotação ainda',
    'Criar primeira anotação',
    'Nova Anotação',
  ]

  it('F: JSON corrompido mostra aviso, texto escapado e nenhum controle de criação', async () => {
    const raw = '{"x":"<img src=x onerror=alert(1)>"}'
    const html = await render({ notes: raw, isEditMode: true })
    expect(html).toContain('Não foi possível ler as anotações')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img')
    for (const text of CREATE_CONTROLS) {
      expect(html).not.toContain(text)
    }
    expect(mutateAsync).toHaveBeenCalledTimes(0)
  })

  it('G: texto antigo é exibido somente leitura, sem controles de criação', async () => {
    for (const isEditMode of [false, true]) {
      const html = await render({ notes: LEGACY_TEXT, isEditMode })
      expect(html).toContain('Anotações em formato antigo')
      expect(html).toContain(LEGACY_TEXT)
      for (const text of CREATE_CONTROLS) {
        expect(html).not.toContain(text)
      }
      expect(mutateAsync).toHaveBeenCalledTimes(0)
    }
  })

  it('H: controle - notas vazias graváveis mantêm o estado vazio e os botões de criar', async () => {
    const html = await render({ notes: '[]', isEditMode: true })
    for (const text of CREATE_CONTROLS) {
      expect(html).toContain(text)
    }
  })
})

describe('NotesTab alertas de estado (DS-07)', () => {
  it('corrompido: alerta destrutivo com Copiar texto original, em edição e bloqueado, sem gravar', async () => {
    for (const isEditMode of [true, false]) {
      const html = await render({ notes: MALFORMED_JSON, isEditMode })
      expect(html).toContain('Anotações corrompidas')
      expect(html).toContain('Copiar texto original')
      expect(html).not.toContain('Migrar anotações')
      expect(mutateAsync).toHaveBeenCalledTimes(0)
    }
  })

  it('legado em edição (aguardando): alerta de status sem botão e sem gravar', async () => {
    const html = await render({ notes: LEGACY_TEXT, isEditMode: true })
    expect(html).toContain('Anotações em formato antigo')
    expect(html).toContain(LEGACY_TEXT)
    expect(html).toContain('Se esta mensagem não sumir')
    expect(html).not.toContain('Copiar texto original')
    expect(html).not.toContain('Migrar anotações')
    expect(html).not.toContain('Convertendo')
    expect(mutateAsync).toHaveBeenCalledTimes(0)
  })

  it('legado bloqueado: pede para desbloquear a ficha', async () => {
    const html = await render({ notes: LEGACY_TEXT, isEditMode: false })
    expect(html).toContain(
      'Desbloqueie a ficha para converter as anotações para o novo formato.',
    )
    expect(html).not.toContain('Migrar anotações')
  })

  it('legado convertendo: mostra Convertendo… com spinner', async () => {
    useUpdateCharacter.mockImplementationOnce(() => ({
      mutateAsync,
      isPending: true,
      error: null,
    }))
    const html = await render({ notes: LEGACY_TEXT, isEditMode: true })
    expect(html).toContain('Convertendo…')
    expect(html).toContain('animate-ficha-spin')
  })

  it('legado com falha: pede para recarregar a página', async () => {
    useUpdateCharacter.mockImplementationOnce(
      () =>
        ({
          mutateAsync,
          isPending: false,
          error: null,
          isError: true,
        }) as unknown as ReturnType<typeof useUpdateCharacter>,
    )
    const html = await render({ notes: LEGACY_TEXT, isEditMode: true })
    expect(html).toContain('Recarregue a página para tentar de novo')
    expect(html).not.toContain('Convertendo…')
  })
})
