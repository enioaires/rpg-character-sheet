// Testes do helper de cópia para a área de transferência

import { describe, expect, it, mock, spyOn } from 'bun:test'
import { copyTextToClipboard, type ClipboardWriter } from './clipboard'

describe('copyTextToClipboard', () => {
  it('copia o texto exato e retorna copied', async () => {
    const writeText = mock(async (_text: string) => {})
    const result = await copyTextToClipboard('a\n  b ', { writeText })
    expect(result).toBe('copied')
    expect(writeText).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith('a\n  b ')
  })

  it('retorna unavailable sem clipboard ou sem writeText', async () => {
    expect(await copyTextToClipboard('x', undefined)).toBe('unavailable')
    expect(await copyTextToClipboard('x', null)).toBe('unavailable')
    expect(await copyTextToClipboard('x', {} as unknown as ClipboardWriter)).toBe(
      'unavailable',
    )
  })

  it('retorna failed quando writeText rejeita', async () => {
    const writer: ClipboardWriter = {
      writeText: async () => {
        throw new Error('negado')
      },
    }
    expect(await copyTextToClipboard('x', writer)).toBe('failed')
  })

  it('retorna failed quando writeText lança de forma síncrona', async () => {
    const writer = {
      writeText: () => {
        throw new Error('negado')
      },
    } as unknown as ClipboardWriter
    expect(await copyTextToClipboard('x', writer)).toBe('failed')
  })

  it('não escreve nada no console em nenhum resultado', async () => {
    const spies = (['log', 'info', 'debug', 'error'] as const).map((method) =>
      spyOn(console, method).mockImplementation(() => {}),
    )
    try {
      await copyTextToClipboard('x', { writeText: async () => {} })
      await copyTextToClipboard('x', undefined)
      await copyTextToClipboard('x', {
        writeText: async () => {
          throw new Error('negado')
        },
      })
      for (const spy of spies) expect(spy).toHaveBeenCalledTimes(0)
    } finally {
      for (const spy of spies) spy.mockRestore()
    }
  })
})
