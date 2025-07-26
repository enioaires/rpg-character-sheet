// Valores padrão para criação de personagem
export const getDefaultCharacterData = () => ({
  // Nível e XP
  level: 0,
  currentXP: 0,

  // Atributos iniciais (todos zerados, usuário vai preencher)
  attributes: {
    agilidade: { race: 0, class: 0, bonus: 0 },
    carisma: { race: 0, class: 0, bonus: 0 },
    coragem: { race: 0, class: 0, bonus: 0 },
    destreza: { race: 0, class: 0, bonus: 0 },
    esquiva: { race: 0, class: 0, bonus: 0 },
    forca: { race: 0, class: 0, bonus: 0 },
    inteligencia: { race: 0, class: 0, bonus: 0 },
    iniciativa: { race: 0, class: 0, bonus: 0 },
    intimidar: { race: 0, class: 0, bonus: 0 },
    manobra: { race: 0, class: 0, bonus: 0 },
    reflexos: { race: 0, class: 0, bonus: 0 },
    sabedoria: { race: 0, class: 0, bonus: 0 },
    vigor: { race: 0, class: 0, bonus: 0 },
    vontade: { race: 0, class: 0, bonus: 0 },
  },

  // Vitalidade base
  vitality: { race: 0, class: 0 },
  currentVitality: {
    notavel: 0,
    ferido: 0,
    gravementeFerido: 0,
    condenado: 0,
    incapacitado: 0,
    coma: 0,
  },

  // Berkana
  maxBerkana: 100,
  currentBerkana: 100,
  berkanaBonus: 0,

  // Perícias (todas as 35 perícias zeradas)
  skills: {
    acrobacia: { distributed: 0, bonus: 0 },
    atuacao: { distributed: 0, bonus: 0 },
    avaliar: { distributed: 0, bonus: 0 },
    ataqueSurpresa: { distributed: 0, bonus: 0 },
    blefar: { distributed: 0, bonus: 0 },
    concentracao: { distributed: 0, bonus: 0 },
    controleArcano: { distributed: 0, bonus: 0 },
    controleEmocional: { distributed: 0, bonus: 0 },
    combateDesarmado: { distributed: 0, bonus: 0 },
    conhecimentoArcano: { distributed: 0, bonus: 0 },
    conhecimentoPolitico: { distributed: 0, bonus: 0 },
    conhecimentoHistorico: { distributed: 0, bonus: 0 },
    conhecimentoReligioso: { distributed: 0, bonus: 0 },
    conhecimentoNatureza: { distributed: 0, bonus: 0 },
    conhecimentoMilitar: { distributed: 0, bonus: 0 },
    cura: { distributed: 0, bonus: 0 },
    cavalgar: { distributed: 0, bonus: 0 },
    duelo: { distributed: 0, bonus: 0 },
    dissuadir: { distributed: 0, bonus: 0 },
    diplomacia: { distributed: 0, bonus: 0 },
    discernir: { distributed: 0, bonus: 0 },
    dissimulacao: { distributed: 0, bonus: 0 },
    empatia: { distributed: 0, bonus: 0 },
    escalar: { distributed: 0, bonus: 0 },
    equilibrio: { distributed: 0, bonus: 0 },
    furtar: { distributed: 0, bonus: 0 },
    furtividade: { distributed: 0, bonus: 0 },
    nadar: { distributed: 0, bonus: 0 },
    oficios: { distributed: 0, bonus: 0 },
    percepcao: { distributed: 0, bonus: 0 },
    prontidao: { distributed: 0, bonus: 0 },
    persuadir: { distributed: 0, bonus: 0 },
    sobrevivencia: { distributed: 0, bonus: 0 },
    suportar: { distributed: 0, bonus: 0 },
    salvar: { distributed: 0, bonus: 0 },
    velocidade: { distributed: 0, bonus: 0 },
  },

  // Equipamentos vazios
  weapons: [],
  armor: { name: '', description: '', totalVitality: 0, currentVitality: 0 },

  // Kit padrão conforme documentação
  adventureKit: [
    { name: 'Cantil 3 Litros', quantity: 1, isDefault: true },
    { name: 'Cera 1 frasco', quantity: 1, isDefault: true },
    { name: 'Chifre-polvora 400g', quantity: 1, isDefault: true },
    { name: 'Espelho', quantity: 1, isDefault: true },
    { name: 'Faca multiuso', quantity: 1, isDefault: true },
    { name: 'Frasco 12 unidades', quantity: 1, isDefault: true },
    { name: 'Frasco de anula faro 4 unidades', quantity: 1, isDefault: true },
    { name: 'Frasco de oleo 3 litros', quantity: 1, isDefault: true },
    { name: 'Lente de aumento', quantity: 1, isDefault: true },
    { name: 'Corda 15 metros', quantity: 1, isDefault: true },
    { name: 'Saco de linhagem', quantity: 1, isDefault: true },
    { name: 'Saco de dormir', quantity: 1, isDefault: true },
    { name: 'Martelo multiuso', quantity: 1, isDefault: true },
    { name: 'Kit de acampamento para 4 pessoas', quantity: 1, isDefault: true },
    { name: 'Kit de banho', quantity: 1, isDefault: true },
    { name: 'Kit de costura', quantity: 1, isDefault: true },
    { name: 'Kit escalada', quantity: 1, isDefault: true },
    { name: 'Kit panelas', quantity: 1, isDefault: true },
    { name: 'Kit primeiros-socorros', quantity: 1, isDefault: true },
    { name: 'Kit provisoes', quantity: 1, isDefault: true },
    { name: 'Kit iluminação', quantity: 1, isDefault: true },
    { name: 'Kit dissimulados', quantity: 1, isDefault: true },
    { name: 'Kit reparo de forja', quantity: 1, isDefault: true },
  ],

  // Finanças zeradas
  finances: { ouro: 0, prata: 0, cobre: 0, imperano: 0, joias: 0 },

  // Linguagens padrão desmarcadas
  languages: {
    standard: {
      comum: false,
      errante: false,
      elfico: false,
      sombrio: false,
      anao: false,
      sigilico: false,
    },
    custom: [],
  },

  // Arrays vazios
  spells: [],
  talents: [],
})