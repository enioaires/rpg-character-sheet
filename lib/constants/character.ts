// Constantes do sistema de personagem

// Lista completa de atributos
export const ATTRIBUTES = [
  'agilidade',
  'carisma', 
  'coragem',
  'destreza',
  'esquiva',
  'força',
  'inteligencia',
  'iniciativa',
  'intimidar',
  'manobra',
  'reflexos',
  'sabedoria',
  'vigor',
  'vontade'
] as const

// Lista completa de perícias
export const SKILLS = [
  'acrobacia',
  'atuação',
  'avaliar',
  'ataqueSupresa',
  'blefar',
  'concentração',
  'controleArcano',
  'controleEmocional',
  'combateDesarmado',
  'conhecimentoArcano',
  'conhecimentoPolitico',
  'conhecimentoHistorico',
  'conhecimentoReligioso',
  'conhecimentoNatureza',
  'conhecimentoMilitar',
  'cura',
  'cavalgar',
  'duelo',
  'dissuadir',
  'diplomacia',
  'discernir',
  'dissimulação',
  'empatia',
  'escalar',
  'equilibrio',
  'furtar',
  'furtividade',
  'nadar',
  'oficios',
  'percepção',
  'prontidão',
  'persuadir',
  'sobrevivência',
  'suportar',
  'salvar',
  'velocidade'
] as const

export type AttributeKey = (typeof ATTRIBUTES)[number]
export type SkillKey = (typeof SKILLS)[number]

// Siglas dos atributos, mostradas na legenda das perícias
export const ATTRIBUTE_ABBREVIATIONS: Record<AttributeKey, string> = {
  agilidade: 'AGI',
  carisma: 'CAR',
  coragem: 'COR',
  destreza: 'DES',
  esquiva: 'ESQ',
  força: 'FOR',
  inteligencia: 'INT',
  iniciativa: 'INI',
  intimidar: 'ITM',
  manobra: 'MAN',
  reflexos: 'REF',
  sabedoria: 'SAB',
  vigor: 'VIG',
  vontade: 'VON'
}

// Atributo que limita os pontos distribuídos de cada perícia (tabela do dono, 2026-11-04).
// oficios usa inteligencia: o "ESP" da tabela foi confirmado como INT.
// Record<SkillKey, ...> faz o TypeScript recusar uma perícia sem atributo.
export const SKILL_ATTRIBUTES: Record<SkillKey, AttributeKey> = {
  acrobacia: 'agilidade',
  atuação: 'carisma',
  avaliar: 'inteligencia',
  ataqueSupresa: 'manobra',
  blefar: 'carisma',
  concentração: 'inteligencia',
  controleArcano: 'sabedoria',
  controleEmocional: 'inteligencia',
  combateDesarmado: 'agilidade',
  conhecimentoArcano: 'sabedoria',
  conhecimentoPolitico: 'sabedoria',
  conhecimentoHistorico: 'sabedoria',
  conhecimentoReligioso: 'sabedoria',
  conhecimentoNatureza: 'sabedoria',
  conhecimentoMilitar: 'sabedoria',
  cura: 'sabedoria',
  cavalgar: 'manobra',
  duelo: 'destreza',
  dissuadir: 'carisma',
  diplomacia: 'carisma',
  discernir: 'sabedoria',
  dissimulação: 'inteligencia',
  empatia: 'carisma',
  escalar: 'força',
  equilibrio: 'agilidade',
  furtar: 'destreza',
  furtividade: 'agilidade',
  nadar: 'manobra',
  oficios: 'inteligencia',
  percepção: 'inteligencia',
  prontidão: 'reflexos',
  persuadir: 'carisma',
  sobrevivência: 'sabedoria',
  suportar: 'vigor',
  salvar: 'iniciativa',
  velocidade: 'vigor'
}

// Nomes amigáveis dos atributos
export const ATTRIBUTE_LABELS: Record<string, string> = {
  agilidade: 'Agilidade',
  carisma: 'Carisma',
  coragem: 'Coragem',
  destreza: 'Destreza',
  esquiva: 'Esquiva',
  força: 'Força',
  inteligencia: 'Inteligência',
  iniciativa: 'Iniciativa',
  intimidar: 'Intimidar',
  manobra: 'Manobra',
  reflexos: 'Reflexos',
  sabedoria: 'Sabedoria',
  vigor: 'Vigor',
  vontade: 'Vontade'
}

// Nomes amigáveis das perícias
export const SKILL_LABELS: Record<string, string> = {
  acrobacia: 'Acrobacia',
  atuação: 'Atuação',
  avaliar: 'Avaliar',
  ataqueSupresa: 'Ataque Surpresa',
  blefar: 'Blefar',
  concentração: 'Concentração',
  controleArcano: 'Controle Arcano',
  controleEmocional: 'Controle Emocional',
  combateDesarmado: 'Combate (Desarmado)',
  conhecimentoArcano: 'Conhecimento Arcano',
  conhecimentoPolitico: 'Conhecimento Político',
  conhecimentoHistorico: 'Conhecimento Histórico',
  conhecimentoReligioso: 'Conhecimento Religioso',
  conhecimentoNatureza: 'Conhecimento da Natureza',
  conhecimentoMilitar: 'Conhecimento Militar',
  cura: 'Cura',
  cavalgar: 'Cavalgar',
  duelo: 'Duelo',
  dissuadir: 'Dissuadir',
  diplomacia: 'Diplomacia',
  discernir: 'Discernir',
  dissimulação: 'Dissimulação',
  empatia: 'Empatia',
  escalar: 'Escalar',
  equilibrio: 'Equilíbrio',
  furtar: 'Furtar',
  furtividade: 'Furtividade',
  nadar: 'Nadar',
  oficios: 'Ofícios',
  percepção: 'Percepção',
  prontidão: 'Prontidão',
  persuadir: 'Persuadir',
  sobrevivência: 'Sobrevivência',
  suportar: 'Suportar',
  salvar: 'Salvar',
  velocidade: 'Velocidade'
}

// Kit de aventureiro padrão
export const DEFAULT_ADVENTURE_KIT = [
  { name: 'Cantil 3 Litros', quantity: 1 },
  { name: 'Cera 1 frasco', quantity: 1 },
  { name: 'Chifre-polvora 400g', quantity: 1 },
  { name: 'Espelho', quantity: 1 },
  { name: 'Faca multiuso', quantity: 1 },
  { name: 'Frasco 12 unidades', quantity: 1 },
  { name: 'Frasco de anula faro 4 unidades', quantity: 1 },
  { name: 'Frasco de oleo 3 litros', quantity: 1 },
  { name: 'Lente de aumento', quantity: 1 },
  { name: 'Corda 15 metros', quantity: 1 },
  { name: 'Saco de linhagem', quantity: 1 },
  { name: 'Saco de dormir', quantity: 1 },
  { name: 'Martelo multiuso', quantity: 1 },
  { name: 'Kit de acampamento para 4 pessoas', quantity: 1 },
  { name: 'Kit de banho', quantity: 1 },
  { name: 'Kit de costura', quantity: 1 },
  { name: 'Kit escalada', quantity: 1 },
  { name: 'Kit panelas', quantity: 1 },
  { name: 'Kit primeiros-socorros', quantity: 1 },
  { name: 'Kit provisoes', quantity: 1 },
  { name: 'Kit iluminação', quantity: 1 },
  { name: 'Kit dissimulados', quantity: 1 },
  { name: 'Kit reparo de forja', quantity: 1 }
]

// Linguagens padrão
export const STANDARD_LANGUAGES = [
  'comum',
  'errante', 
  'elfico',
  'sombrio',
  'anão',
  'sigilico'
] as const

// Vitalidade ganha por nível quando vitality.perLevel não está gravado (linhas antigas)
export const DEFAULT_VITALITY_PER_LEVEL = 700
