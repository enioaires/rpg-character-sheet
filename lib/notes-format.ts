// lib/notes-format.ts
// Formatador puro do conteúdo das anotações: escapa o HTML e só então aplica
// a formatação markdown-like. Sem React, sem DOM, sem dependências.

/** Escapa & < > " ' para uso seguro como conteúdo de texto HTML. & é substituído primeiro. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Escapa o texto da anotação e aplica a formatação markdown-like (negrito,
 * itálico, código, títulos ###/##/#, itens "- ", parágrafos e quebras de linha).
 * Retorna uma string HTML para dangerouslySetInnerHTML.
 *
 * Invariante de segurança:
 * - o texto é escapado ANTES de qualquer marcação ser gerada;
 * - os grupos capturados só entram no conteúdo de elementos, nunca em atributos;
 * - logo, a saída só pode conter o conjunto fixo de tags strong/em/code/h1/h2/h3/li/p/br.
 */
export function formatNoteHtml(text: string): string {
  let formatted = escapeHtml(text)
    // Negrito: **texto** -> <strong>texto</strong>
    .replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-semibold text-foreground">$1</strong>',
    )
    // Itálico: *texto* -> <em>texto</em>
    .replace(/\*(.*?)\*/g, '<em class="italic text-muted-foreground">$1</em>')
    // Código: `texto` -> <code>texto</code>
    .replace(
      /`(.*?)`/g,
      '<code class="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border">$1</code>',
    )
    // Títulos: ### Título -> <h3>Título</h3>
    .replace(
      /^### (.*$)/gm,
      '<h3 class="text-base font-semibold mt-3 mb-1 text-foreground">$1</h3>',
    )
    .replace(
      /^## (.*$)/gm,
      '<h2 class="text-lg font-semibold mt-4 mb-2 text-foreground">$1</h2>',
    )
    .replace(
      /^# (.*$)/gm,
      '<h1 class="text-xl font-bold mt-4 mb-2 text-foreground">$1</h1>',
    )
    // Lista simples: - item -> <li>item</li>
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc list-inside">$1</li>')
    // Quebras de linha duplas para parágrafos
    .replace(/\n\n/g, '</p><p class="mb-2">')
    // Quebras de linha simples
    .replace(/\n/g, '<br />')

  // Envolver em parágrafo se não começar com tag HTML. Um "<" digitado pelo
  // usuário vira "&lt;", então uma nota que começa com "<" agora é envolvida
  // em parágrafo como qualquer texto simples (intencional).
  if (!formatted.startsWith('<')) {
    formatted = `<p class="mb-2">${formatted}</p>`
  }

  return formatted
}
