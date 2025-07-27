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

// Nomes das vitalidades
export const VITALITY_LEVELS = [
  'notavel',
  'ferido',
  'gravementeFerido',
  'condenado',
  'incapacitado',
  'coma'
] as const

export const VITALITY_LABELS: Record<string, string> = {
  notavel: 'Notável',
  ferido: 'Ferido',
  gravementeFerido: 'Gravemente Ferido',
  condenado: 'Condenado',
  incapacitado: 'Incapacitado',
  coma: 'Coma'
}

// Funções de cálculo
export const calculateXPForNextLevel = (currentLevel: number): number => {
  return (currentLevel + 1) * 10
}

export const calculateAttributeBonus = (level: number): number => {
  return level >= 5 ? Math.floor(level / 5) : 0
}

export const calculateSkillBonus = (level: number): number => {
  return Math.floor(level / 5)
}

export const calculateSkillPointsAvailable = (level: number): number => {
  return (level + 1) * 10 // Inclui o nível 0
}

export const calculateBerkana = (level: number, bonus: number = 0): number => {
  return 100 + (level * 10) + bonus
}

export const calculateVitality = (
  raceVitality: number, 
  classVitality: number, 
  level: number
): Record<string, number> => {
  const baseTotal = raceVitality + classVitality
  const multiplier = level + 1
  
  return {
    notavel: baseTotal * multiplier,
    ferido: (baseTotal - 20) * multiplier,
    gravementeFerido: (baseTotal - 40) * multiplier,
    condenado: (baseTotal - 60) * multiplier,
    incapacitado: (baseTotal - 80) * multiplier,
    coma: (baseTotal - 100) * multiplier
  }
}