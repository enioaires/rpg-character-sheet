// lib/clipboard.ts
// Cópia para a área de transferência sem dependências de framework. O chamador
// passa o objeto de clipboard. O texto copiado nunca é registrado em log.

export type CopyResult = 'copied' | 'unavailable' | 'failed'

export interface ClipboardWriter {
  writeText(text: string): Promise<void>
}

/** Nunca lança: 'unavailable' sem API, 'failed' se a escrita for recusada. */
export async function copyTextToClipboard(
  text: string,
  clipboard: ClipboardWriter | null | undefined,
): Promise<CopyResult> {
  if (!clipboard || typeof clipboard.writeText !== 'function') {
    return 'unavailable'
  }
  try {
    await clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
