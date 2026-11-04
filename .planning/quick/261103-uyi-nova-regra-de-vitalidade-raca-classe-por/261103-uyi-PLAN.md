---
phase: quick-261103-uyi
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/constants/character.ts
  - lib/calculations/index.ts
  - lib/calculations/index.test.ts
  - components/character/basic-info/basic-info-model.ts
  - components/character/basic-info/basic-info-model.test.ts
  - components/character/basic-info/vitality-card.tsx
  - components/character/basic-info-tab.render.test.ts
  - components/ui/editable-field.tsx
  - components/ui/editable-field.test.ts
  - components/character/quick-sheets/vitality-sheet.tsx
  - components/character/quick-actions-bar.tsx
  - components/character/quick-actions.render.test.ts
  - components/character/resource-display.ts
  - lib/schemas/calculations.ts
  - lib/schemas/character.ts
  - lib/schemas/character.test.ts
  - lib/defaults/character.ts
  - app/character/[id]/page.tsx
  - prisma/schema.prisma
  - lib/store/character.ts
  - lib/api/queries.ts
autonomous: true
requirements: [QUICK-261103-uyi]

estimate:
  tokens: 110000
  raw_tokens: 110000
  tasks: 3
  confidence: low

must_haves:
  truths:
    - "Vitalidade máxima = vitality.race + vitality.class + vitality.perLevel × nível. vitality.perLevel ausente, nulo ou não numérico vale 700; um 0 gravado continua 0. Ex.: 3500 + 3500 + 700 × 5 = 10500; nível 0 = só as bases (7000)"
    - "O card Vitalidade mostra um total único: atual / máximo formatados (pt-BR), UMA barra (no lugar das seis barrinhas), os botões Dano e Cura, uma linha editável 'Atual' (currentVitality.current) e três campos editáveis lado a lado: 'Base da raça', 'Base da classe', 'Por nível'. Não existem mais a lista de seis estágios, o badge de estágio com posição N/6 nem o texto de que o dano desce pelos estágios. Só quando o máximo é <= 0 aparece o badge neutro 'Sem vitalidade definida'"
    - "Linhas existentes sem currentVitality.current (ausente ou null) aparecem com vida cheia (atual = máximo); as chaves antigas de estágio não influenciam nenhum número exibido"
    - "Dano subtrai do atual (mínimo 0); Cura soma até o máximo e nunca reduz um atual que já está acima do máximo; Restaurar grava atual = máximo (mínimo 0). Toda gravação de vitalidade (sheet e edição inline) envia o objeto currentVitality inteiro, com as chaves antigas e desconhecidas preservadas e só `current` alterado"
    - "A barra rápida mostra atual/máximo sem estágio e o aria-label é exatamente 'Vitalidade {atual} de {máximo}'"
    - "PUT /api/characters/:id aceita currentVitality antigo (seis chaves), o novo { current: número | null } misturado com chaves antigas e vitality com perLevel; rejeita current ou perLevel não numéricos com 400. Novos personagens nascem com vitality.perLevel 700 e currentVitality sem `current`"
    - "Nenhum código de estágio de vitalidade sobra em app/, components/ e lib/; npx tsc --noEmit, bun run lint (0 erros, só o aviso pré-existente de routes), bun test e bun run build passam"
  artifacts:
    - path: "lib/calculations/index.ts"
      provides: "calculateMaxVitality, resolveCurrentVitality, applyVitalityDamage, applyVitalityHeal, restoreVitality, toVitalityBase com perLevel, tipos StoredCurrentVitality e CurrentVitalityValue"
      exports: ["calculateMaxVitality", "resolveCurrentVitality", "applyVitalityDamage", "applyVitalityHeal", "restoreVitality", "toVitalityBase"]
    - path: "lib/constants/character.ts"
      provides: "DEFAULT_VITALITY_PER_LEVEL = 700"
      contains: "DEFAULT_VITALITY_PER_LEVEL"
    - path: "components/character/basic-info/vitality-card.tsx"
      provides: "Card de total único com barra única, linha Atual editável e campo Por nível"
      contains: "field=\"perLevel\""
    - path: "components/ui/editable-field.test.ts"
      provides: "Prova de que a edição inline de currentVitality.current e vitality.perLevel mescla o JSON existente"
    - path: "lib/schemas/calculations.ts"
      provides: "vitalityBaseSchema com perLevel e currentVitalitySchema com current"
      contains: "perLevel"
  key_links:
    - from: "components/character/basic-info/vitality-card.tsx"
      to: "lib/calculations/index.ts"
      via: "buildVitalityView em basic-info-model.ts chama calculateMaxVitality(toVitalityBase(...)) e resolveCurrentVitality"
      pattern: "buildVitalityView"
    - from: "components/character/basic-info/vitality-card.tsx"
      to: "components/ui/editable-field.tsx"
      via: "EditableNumberField section=\"currentVitality\" field=\"current\" → buildUpdateData espalha a seção atual"
      pattern: "field=\"current\""
    - from: "components/character/quick-sheets/vitality-sheet.tsx"
      to: "lib/calculations/index.ts"
      via: "applyVitalityDamage / applyVitalityHeal / restoreVitality devolvem o payload completo enviado em mutateAsync data.currentVitality"
      pattern: "restoreVitality"
    - from: "lib/schemas/character.ts"
      to: "lib/schemas/calculations.ts"
      via: "currentVitalityFieldSchema = currentVitalitySchema.partial().catchall(jsonExtra), usado por updateCharacterSchema no zValidator do PUT"
      pattern: "currentVitalitySchema"
    - from: "lib/defaults/character.ts"
      to: "lib/constants/character.ts"
      via: "vitality.perLevel padrão de novos personagens"
      pattern: "DEFAULT_VITALITY_PER_LEVEL"
---

<objective>
Trocar a regra de vitalidade de seis estágios multiplicados por (nível + 1) por um total único:
máximo = raça + classe + perLevel × nível, com o atual guardado em currentVitality.current.

Purpose: a regra nova foi decidida e confirmada pelo dono do projeto. As fichas em produção
precisam continuar carregando e salvando: as chaves antigas de estágio ficam no JSON e são
preservadas, e `current` ausente significa vida cheia.

Output: helpers puros novos em lib/calculations, card Vitalidade de total único com o campo
"Por nível", sheet de dano/cura e barra rápida sem estágio, schemas e defaults compatíveis,
código de estágio removido, testes reescritos para a regra nova.

Decisões de implementação (discrição do planejador, registradas aqui):
- Badge: mantém o badge neutro "Sem vitalidade definida" só quando máximo <= 0; com vitalidade configurada o card não tem badge (não há estado equivalente a "Cheia/Metade" na regra nova).
- Cor da barra única e do ícone: token existente `vitality-notavel` (verde de vida) sobre `vitality-track`. app/globals.css não muda: os tokens são paleta do design.
- Novos personagens gravam currentVitality `{}` (sem `current`), assim a vida acompanha o máximo até a primeira gravação. Se gravasse current 0, o personagem ficaria zerado ao preencher as bases.
- Restaurar grava um número explícito (current = máximo), igual ao comportamento atual: a vida atual não sobe sozinha quando o máximo muda depois.
- O atual editável inline não recebe `max`: a edição manual pode passar do máximo (é o caso que a Cura não reduz).
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.claude/CLAUDE.md

Fontes lidas pelo planejador (leia antes de cada tarefa só os arquivos dela):
@lib/calculations/index.ts
@components/character/basic-info/vitality-card.tsx
@components/character/basic-info/basic-info-model.ts
@components/character/basic-info/berkana-card.tsx
@components/ui/editable-field.tsx
@components/character/quick-sheets/vitality-sheet.tsx
@components/character/quick-actions-bar.tsx
@lib/schemas/character.ts

Fatos do código (verificados no HEAD 60ebb93):
- buildUpdateData em components/ui/editable-field.tsx, para campo simples (sem ponto), grava `updateData[section] = { ...currentSection, [field]: value }`, onde currentSection = currentCharacterData[section]. Então section="currentVitality" field="current" e section="vitality" field="perLevel" já mesclam no objeto existente e não o substituem. A Tarefa 1 só trava isso com teste e não muda a lógica.
- O PUT grava a coluna Json inteira com o payload validado. Por isso todo payload de currentVitality tem que levar as chaves antigas junto.
- currentVitalityFieldSchema e vitalityFieldSchema hoje terminam em `.catchall(jsonExtra)` (jsonExtra = z.json()), então `current` e `perLevel` numéricos já passam no validador antes da Tarefa 3. A Tarefa 3 só dá tipo a eles.
- A página app/character/[id]/page.tsx sanitiza o personagem antes dos cards; currentVitality nulo hoje vira um objeto com seis zeros. Esse arquivo usa indentação de 4 espaços.
- mock.module do bun vale para o processo inteiro. Os testes de render fazem mock de '@/lib/api/queries' com a forma `{ useUpdateCharacter }` e importam o componente dinamicamente (ver o cabeçalho de components/character/basic-info-tab.render.test.ts). Testes novos que importam componentes seguem esse padrão.
- lib/calculations/index.test.ts termina com o teste "toda função exportada tem teste": a lista TESTED_FUNCTIONS e a contagem (hoje 35) acompanham as exportações. Contagens esperadas: 37 depois da Tarefa 1, 38 depois da Tarefa 2, 34 depois da Tarefa 3.
- O cabeçalho de lib/calculations/index.test.ts proíbe editar valores para acompanhar fórmula alterada. Esta tarefa é a exceção autorizada: a regra de vitalidade mudou por decisão do dono (261103-uyi). Os testes de vitalidade são reescritos, e os de atributos, perícias, Berkana e XP ficam intocados.
- Baselines no HEAD: bun test com 389 pass / 0 fail; bun run lint com "0 errors, 1 warning" (routes em app/api/[[...route]]/route.ts); o grep de código morto da Tarefa 3 encontra 171 linhas (o gate falha no HEAD, como deve).

Estilo: lib/calculations e os componentes de vitalidade usam aspas simples e nenhum ponto e vírgula. Comentários e textos de interface em português, identificadores em inglês. Nada de `any`, `@ts-ignore` nem console.log. Comentários novos não citam pelo nome os identificadores removidos.

Cobertura das fontes (descrição da tarefa → tarefa):
| Item da descrição | Tarefa |
|---|---|
| Fórmula raça + classe + perLevel × nível, nível 0 = bases | 1 |
| perLevel editável "Por nível" ao lado das bases, padrão 700 (constante nomeada) | 1 (card, constante), 3 (defaults) |
| Card só atual/máximo, barra única, sem lista, sem badge de estágio e sem texto de estágios, badge neutro quando máx <= 0 | 1 |
| Atual editável inline em currentVitality.current, mesclando o JSON (verificado em editable-field.tsx) | 1 |
| Dano mínimo 0, Cura até o máximo sem reduzir atual acima do máximo, payload completo com as chaves preservadas | 2 |
| Barra rápida atual/máximo sem estágio, aria-label sem estágio | 2 |
| `current` ausente/nulo = vida cheia; chaves antigas preservadas; schemas aceitam formatos antigos | 1 (leitura), 2 (gravações), 3 (schemas) |
| Comentários do prisma/schema.prisma; sem mudança de coluna nem migração | 3 |
| Remover código morto de estágios; reescrever testes | 2, 3 |
| Lógica de level-up, store, hooks de stats, página, defaults | 1 (processLevelUp), 3 (store, queries, página, defaults) |
| Gate: tsc, lint, test, build | 3 |
</context>

<!-- planner-discipline-allow: calculateVitalityLevels -->
<!-- planner-discipline-allow: resolveCurrentVitalityLevels -->
<!-- planner-discipline-allow: calculateVitalityTotal -->
<!-- planner-discipline-allow: getCurrentVitalityStage -->
<!-- planner-discipline-allow: VITALITY_STAGE_DISPLAY -->
<!-- planner-discipline-allow: VitalityStageDisplay -->
<!-- planner-discipline-allow: VITALITY_LEVELS -->
<!-- planner-discipline-allow: VITALITY_LABELS -->
<!-- planner-discipline-allow: vitalityLevelsSchema -->
<!-- planner-discipline-allow: VitalityStageKey -->
<!-- planner-discipline-allow: VitalityLevels -->
<!-- planner-discipline-allow: CurrentVitalityInput -->
<!-- planner-discipline-allow: fillCurrentVitality -->

<tasks>

<task type="tracer" tdd="true">
  <name>Tarefa 1 (tracer): máximo novo no card Vitalidade, ponta a ponta, com Atual e Por nível editáveis que mesclam o JSON</name>
  <files>lib/constants/character.ts, lib/calculations/index.ts, lib/calculations/index.test.ts, components/character/basic-info/basic-info-model.ts, components/character/basic-info/basic-info-model.test.ts, components/character/basic-info/vitality-card.tsx, components/character/basic-info-tab.render.test.ts, components/ui/editable-field.tsx, components/ui/editable-field.test.ts</files>
  <behavior>
    - calculateMaxVitality({ race: 3500, class: 3500, perLevel: 700 }, 0) = 7000; nível 1 = 7700; nível 5 = 10500; nível 10 = 14000; ({ race: 200, class: 250, perLevel: 700 }, 7) = 5350; perLevel 0 dá só as bases
    - toVitalityBase(undefined | null | {}) = { race: 0, class: 0, perLevel: 700 }; { perLevel: 0 } mantém 0; perLevel null ou NaN vira 700; race/class continuam na regra `|| 0` (null e NaN viram 0)
    - resolveCurrentVitality: undefined, null, {}, { current: null } e o objeto antigo de seis chaves sem `current` devolvem o máximo; { current: 1234 } devolve 1234; { current: 0 } devolve 0 (zero é valor, não ausência); { current: 9000 } com máximo 7000 devolve 9000 (sem teto); current não numérico ou NaN devolve o máximo
    - processLevelUp de 0 para 1 com vitality { race: 200, class: 250, perLevel: 700 }, currentXP 15 e berkanaBonus 5 retorna { level: 1, currentXP: 5, maxBerkana: 115, maxVitality: 1150, xpUsedForLevelUp: 10, newSkillPointsAvailable: 10 }
    - buildVitalityView({ level: 7, vitality: { race: 200, class: 250 }, currentVitality: { notavel: 0, ferido: 1000 } }) dá max 5350, current 5350 (chaves antigas ignoradas, vida cheia), percent 100, isConfigured true, base.perLevel 700; com current 1070 dá percent 20; nível 0 com bases 0 dá max 0, isConfigured false, percent 0; entradas todas indefinidas não lançam
    - Render da aba Básicos com fixtureA (nível 7, raça 200, classe 250, currentVitality { notavel: 0, ferido: 1000, current: 1070 }) contém '1.070', '5.350', 'width:20%', 'Atual', 'Base da raça', 'Base da classe', 'Por nível', 'Dano', 'Cura'; não contém 'Ferido', 'Notável', 'O dano desce' nem um padrão N/6 (regex /\d\/6/); não tem '<input'; não chama mutateAsync nem openSheet
    - Render com nível 0, bases 0 e currentVitality {} contém 'Sem vitalidade definida' e 'width:0%'
    - buildUpdateData('currentVitality', 'current', 4000, { currentVitality: { notavel: 0, ferido: 1000, extra: 'x' } }) = { currentVitality: { notavel: 0, ferido: 1000, extra: 'x', current: 4000 } }; buildUpdateData('vitality', 'perLevel', 650, { vitality: { race: 3500, class: 3500 } }) = { vitality: { race: 3500, class: 3500, perLevel: 650 } }; com currentCharacterData sem a seção, o resultado é { currentVitality: { current: 4000 } }
  </behavior>
  <action>
Constante: em lib/constants/character.ts adicione `DEFAULT_VITALITY_PER_LEVEL = 700`, com comentário em português ("Vitalidade ganha por nível quando vitality.perLevel não está gravado (linhas antigas)"). Deixe as constantes de estágio onde estão, porque a Tarefa 3 as remove.

lib/calculations/index.ts, seção CÁLCULOS DE VITALIDADE. Esta tarefa só adiciona: os helpers antigos de estágio continuam até a Tarefa 3.
- Acrescente `perLevel: number` à interface VitalityBase.
- Reescreva toVitalityBase: race e class seguem a regra `|| 0`. perLevel vale o número gravado quando é finito (0 incluído); ausente, nulo ou não finito vira DEFAULT_VITALITY_PER_LEVEL, importado de '@/lib/constants/character'. Atualize o doc block com essa diferença.
- Adicione `calculateMaxVitality(vitality: VitalityBase, level: number): number`, que retorna race + class + perLevel × level, com doc block em português: "Vitalidade máxima (total único) / Fórmula: race + class + perLevel × nível / Ex.: 3500 + 3500 + 700 × nível; nível 0 = só as bases".
- Adicione o tipo exportado StoredCurrentVitality: objeto com `current?: number | null` e índice `[key: string]: unknown`, ou null, ou undefined. É o currentVitality como vem do banco, com chaves antigas permitidas.
- Adicione `resolveCurrentVitality(currentVitality: StoredCurrentVitality, max: number): number`: retorna `current` quando é number finito, senão `max`. Doc: "ausente ou null = vida cheia; sem teto: um atual acima do máximo (edição manual) é mantido".
- Atualize processLevelUp: troque a chave de retorno das seis vitalidades por `maxVitality: calculateMaxVitality(vitality, newLevel)` e mantenha o comentário de que a vitalidade atual se mantém e só o máximo muda.

lib/calculations/index.test.ts:
- No cabeçalho, acrescente uma nota: a regra de vitalidade mudou por decisão do dono na tarefa 261103-uyi, e os testes de vitalidade fixam a regra nova.
- Adicione describes para calculateMaxVitality e resolveCurrentVitality com os casos de <behavior>.
- Reescreva os testes de toVitalityBase para a forma com perLevel e corrija as expectativas de processLevelUp. Os casos de nível insuficiente e nível 99 também recebem perLevel: 700.
- O objeto vitality do describe de seis estágios e as entradas de VIT_BASES_GRID recebem `perLevel: 700` para o tsc continuar verde. Os helpers antigos ignoram o campo, então nenhum valor esperado antigo muda, e esses blocos saem nas Tarefas 2 e 3.
- Acrescente os dois nomes novos a TESTED_FUNCTIONS e mude a contagem para 37.

basic-info-model.ts:
- Reescreva buildVitalityView({ level, vitality, currentVitality }) para retornar { base, max, current, percent, isConfigured }: base = toVitalityBase(vitality), max = calculateMaxVitality(base, level || 0), current = resolveCurrentVitality(currentVitality, max), percent = getFillPercent(current, max), isConfigured = max > 0.
- Remova VitalityRowView e os imports de estágio. currentVitality no input passa a ser StoredCurrentVitality.
- Reescreva o describe de buildVitalityView em basic-info-model.test.ts com os casos de <behavior> e remova os imports de estágio do teste.

vitality-card.tsx, no mesmo esqueleto e na mesma linguagem visual do berkana-card.tsx:
- action do SectionCard: o badge neutro existente (Heart + "Sem vitalidade definida", BADGE_CLASS + 'border-border text-muted-foreground') só quando !view.isConfigured; senão undefined.
- Mantenha o NumericDisplay hero com formatGameNumber(view.current) e formatGameNumber(view.max).
- Troque as seis barrinhas por uma barra: div aria-hidden 'h-2.5 overflow-hidden rounded-[1px] bg-vitality-track' com filho 'h-full bg-vitality-notavel' e largura `${view.percent}%`.
- Mantenha os botões Dano e Cura sem mudança.
- Troque a lista de estágios por UMA linha com as mesmas classes de grade da linha antiga ('grid min-h-11 -mx-2 grid-cols-[22px_1fr_auto] items-center gap-2.5 rounded-(--radius) px-2'):
  - ícone Heart, 'text-vitality-notavel' quando configurado, senão 'text-muted-foreground';
  - rótulo "Atual" em text-[15px] font-semibold;
  - à direita, EditableNumberField com characterId, currentCharacterData={character}, section="currentVitality", field="current", value={view.current}, displayClassName="justify-end px-1 text-[17px] font-semibold" e isEditMode, sem prop max;
  - depois dele, o span cinza `/ ${view.max}` como antes.
- Grade de bases 'grid grid-cols-3 gap-3' com três EditableNumberField de section="vitality": field="race" rótulo "Base da raça" value view.base.race; field="class" rótulo "Base da classe" value view.base.class; field="perLevel" rótulo "Por nível" value view.base.perLevel.
- Apague o span de rodapé sobre o dano descer pelos estágios.
- Remova os imports de estágio.
- Atualize o comentário de cabeçalho: Dano e Cura abrem a sheet; os campos inline gravam currentVitality.current e vitality.race/class/perLevel, mesclados por buildUpdateData.

basic-info-tab.render.test.ts: acrescente `current: 1070` ao currentVitality da fixtureA e reescreva os dois testes de vitalidade (totais/badge e não configurada) com as expectativas de <behavior>. Os demais testes ficam intocados.

editable-field.tsx: exporte buildUpdateData (`export function`), sem mudar a lógica, e acrescente ao doc block uma linha: "Exportado para teste: campo simples mescla a seção existente (chaves antigas preservadas)". Crie components/ui/editable-field.test.ts:
- siga o padrão do cabeçalho de basic-info-tab.render.test.ts: mock.module('@/lib/api/queries', () => ({ useUpdateCharacter })) com o mesmo formato de mock e import dinâmico de '@/components/ui/editable-field';
- cubra os três casos de buildUpdateData de <behavior>;
- comentário de topo em português explicando que o teste trava a compatibilidade de currentVitality.
  </action>
  <verify>
    <automated>bun test lib/calculations/index.test.ts components/character/basic-info/basic-info-model.test.ts components/character/basic-info-tab.render.test.ts components/ui/editable-field.test.ts && npx tsc --noEmit && test "$(grep -c 'field="perLevel"' components/character/basic-info/vitality-card.tsx)" -ge 1 && test "$(grep -c 'field="current"' components/character/basic-info/vitality-card.tsx)" -ge 1</automated>
    <human-check>Abrir uma ficha a 375px de largura: o card Vitalidade mostra atual/máximo, uma barra, Dano/Cura, a linha Atual e os três campos (Base da raça, Base da classe, Por nível) cabendo numa linha sem cortar os rótulos.</human-check>
  </verify>
  <done>O card mostra o total único calculado pela regra nova (linhas antigas aparecem com vida cheia). Atual e Por nível são editáveis inline e o teste prova que a gravação mescla o JSON existente. Os quatro arquivos de teste e o tsc passam, e a contagem de exportações testadas é 37.</done>
</task>

<task type="auto" tdd="true">
  <name>Tarefa 2: dano, cura e restauração no total único; barra rápida e sheet sem estágio</name>
  <files>lib/calculations/index.ts, lib/calculations/index.test.ts, components/character/quick-sheets/vitality-sheet.tsx, components/character/quick-actions-bar.tsx, components/character/quick-actions.render.test.ts, components/character/resource-display.ts</files>
  <behavior>
    - applyVitalityDamage(undefined, 7000, 1000) = { current: 6000 }; applyVitalityDamage({ current: 500 }, 7000, 1000) = { current: 0 } (mínimo 0); applyVitalityDamage({ notavel: 0, ferido: 1000, extra: 'x' }, 5350, 350) = { notavel: 0, ferido: 1000, extra: 'x', current: 5000 }; o objeto de entrada não é mutado
    - applyVitalityHeal({ current: 3000 }, 7000, 1000) = { current: 4000 }; ({ current: 6500 }, 7000, 1000) = { current: 7000 }; ({ current: 9000 }, 7000, 500) = { current: 9000 } (nunca reduz); ({ current: 0 }, 0, 500) = { current: 0 } (máximo <= 0 não muda); chaves antigas preservadas
    - restoreVitality({ notavel: 0, current: 10 }, 7000) = { notavel: 0, current: 7000 }; restoreVitality(null, -50) = { current: 0 }
    - Barra rápida com nível 7, raça 200, classe 250 e currentVitality { notavel: 0, ferido: 1000, current: 1070 } contém '1.070', '/5.350' e 'aria-label="Vitalidade 1.070 de 5.350"'; não contém 'Ferido' nem 'text-vitality-ferido'
    - Barra rápida com nível 0, bases 0 e as seis chaves antigas zeradas sem current contém 'aria-label="Vitalidade 0 de 0"' e 'text-muted-foreground'; os testes existentes de Berkana, Bloqueado e cores fixas continuam passando
  </behavior>
  <action>
lib/calculations/index.ts, seção RECURSOS EM JOGO:
- Adicione o tipo exportado CurrentVitalityValue: payload completo de currentVitality a gravar, com `current: number` e índice de valores JSON. Defina um alias local JsonValue recursivo (string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }), no mesmo formato que z.json() aceita. Use `type` e não `interface`, com comentário: precisa ser atribuível ao índice JSON de updateCharacterSchema para ir direto em mutateAsync, sem cast no chamador.
- Adicione um helper privado que copia o objeto armazenado (`{ ...(currentVitality ?? {}) }`) e define `current`. Um único cast para CurrentVitalityValue é permitido aqui, com comentário: o objeto veio de uma coluna Json, então os valores são JSON.
- Reescreva applyVitalityDamage(currentVitality: StoredCurrentVitality, max: number, damageAmount: number): CurrentVitalityValue. atual = resolveCurrentVitality(currentVitality, max) e current = Math.max(0, atual - damageAmount). Doc: "Dano: subtrai do atual, nunca abaixo de 0; devolve o payload completo, chaves antigas preservadas".
- Reescreva applyVitalityHeal com a mesma assinatura: current = Math.max(atual, Math.min(max, atual + healAmount)). É a mesma regra de recoverBerkana. Doc: "soma até o máximo; nunca reduz um atual acima do máximo; máximo <= 0 não muda".
- Adicione restoreVitality(currentVitality: StoredCurrentVitality, max: number): CurrentVitalityValue, com current = Math.max(0, max).
- Apague o helper privado fillCurrentVitality, que fica sem uso.
- Não mexa nos helpers de estágio restantes: a Tarefa 3 os remove.

lib/calculations/index.test.ts:
- Apague os describes antigos de applyVitalityDamage e applyVitalityHeal (os aninhados também) e os oráculos congelados que só eles usavam (o laço legado de dano e qualquer oráculo de cura).
- Mantenha os helpers de oráculo e as grades que ainda servem aos describes de estágio. A Tarefa 3 apaga o resto.
- Escreva os describes novos de applyVitalityDamage, applyVitalityHeal e restoreVitality com os casos de <behavior>, incluindo a checagem de que a entrada não é mutada.
- Acrescente restoreVitality a TESTED_FUNCTIONS e mude a contagem para 38.

vitality-sheet.tsx:
- base = toVitalityBase(vitality), max = calculateMaxVitality(base, level || 0), current = resolveCurrentVitality(currentVitality, max), isConfigured = max > 0, hasNothingToHeal = current >= max.
- O parâmetro de write passa a ser CurrentVitalityValue.
- handleDamage, handleHeal e handleRestore enviam applyVitalityDamage(currentVitality, max, amountValue), applyVitalityHeal(currentVitality, max, amountValue) e restoreVitality(currentVitality, max). Toasts e mensagens de log continuam como estão. Troque o comentário "Mesmo payload do antigo Vida Máxima" por "Restaura: atual = máximo".
- previewText: `Dano → {formatado de resolveCurrentVitality(applyVitalityDamage(...), max)} · Cura → {formatado do mesmo para applyVitalityHeal}`, sem rótulos de estágio. Apague a função auxiliar de rótulo de estágio.
- No cabeçalho, o NumericDisplay mostra current/max. O span neutro "Sem vitalidade definida" (Heart, text-muted-foreground) aparece só quando !isConfigured; o ramo de estágio sai.
- A mensagem de vitalidade não configurada fica como está.
- Remova os imports sem uso (constantes e mapa de estágio; `cn` se ficar sem uso).

quick-actions-bar.tsx:
- max = calculateMaxVitality(toVitalityBase(character.vitality), character.level || 0), current = resolveCurrentVitality(character.currentVitality, max), isConfigured = max > 0.
- O botão de vitalidade espelha o markup do botão de Berkana:
  - ícone Heart com cn('size-[22px]', isConfigured ? 'text-vitality-notavel' : 'text-muted-foreground');
  - primeira linha com formatGameNumber(current) seguido do span 'text-[15px] font-medium text-muted-foreground' com `/${formatGameNumber(max)}`;
  - segunda linha "Vitalidade" em 'text-xs font-semibold whitespace-nowrap' com a mesma classe de cor do ícone.
- aria-label exatamente `Vitalidade ${formatGameNumber(current)} de ${formatGameNumber(max)}`.
- Remova StageIcon, a exibição de estágio e os imports de estágio.

resource-display.ts:
- Apague o tipo e o mapa de exibição dos estágios, o import dos rótulos de estágio, o import do tipo de chave de estágio e os ícones lucide que ficarem sem uso. Mantenha BERKANA_STATE_DISPLAY, formatGameNumber e os ícones da Berkana.
- Atualize o comentário de cabeçalho para "Mapa de exibição da Berkana e formatador de números".

quick-actions.render.test.ts: acrescente `current: 1070` ao currentVitality de barCharacter e reescreva o teste principal e o teste de vitalidade 0/0 com as expectativas de <behavior>. Atualize o comentário do teste sobre o fallback por nível.
  </action>
  <verify>
    <automated>bun test lib/calculations/index.test.ts components/character/quick-actions.render.test.ts components/character/basic-info-tab.render.test.ts && npx tsc --noEmit && ! grep -rnE 'VITALITY_STAGE_DISPLAY|fillCurrentVitality' app components lib --include=*.ts --include=*.tsx</automated>
    <human-check>Na ficha a 375px: a barra rápida mostra o número atual com /máximo e "Vitalidade" sem estourar o botão; na sheet, aplicar 100 de dano e depois 100 de cura volta ao valor anterior; Restaurar enche até o máximo; a ficha recarregada mantém o valor.</human-check>
  </verify>
  <done>Dano, cura e restauração gravam o currentVitality completo com `current` atualizado e as chaves antigas preservadas. A barra rápida e a sheet mostram atual/máximo sem estágio. O mapa de exibição de estágios não existe mais, os testes e o tsc passam, e a contagem de exportações testadas é 38.</done>
</task>

<task type="auto" tdd="true">
  <name>Tarefa 3: compatibilidade de dados, novos personagens e remoção do código de estágios (gate completo)</name>
  <files>lib/calculations/index.ts, lib/calculations/index.test.ts, lib/constants/character.ts, lib/schemas/calculations.ts, lib/schemas/character.ts, lib/schemas/character.test.ts, lib/defaults/character.ts, app/character/[id]/page.tsx, prisma/schema.prisma, lib/store/character.ts, lib/api/queries.ts</files>
  <behavior>
    - updateCharacterSchema aceita: vitality { race: 3500, class: 3500, perLevel: 700 }; vitality { race: 0, class: 0 } (sem perLevel); currentVitality com as seis chaves antigas (inclusive negativas); { current: 5000, notavel: 0, ferido: -20 }; { current: null }; {}
    - updateCharacterSchema rejeita: currentVitality null; currentVitality { current: '5' }; vitality { perLevel: '700' }; vitality array; os demais casos malformados existentes continuam rejeitados
    - getDefaultCharacterData() tem vitality { race: 0, class: 0, perLevel: 700 } e currentVitality {}, e continua passando em updateCharacterSchema
    - TESTED_FUNCTIONS tem 34 nomes e bate com as exportações
  </behavior>
  <action>
Remoção do código de estágios em lib/calculations/index.ts: apague calculateVitalityLevels, o tipo VitalityLevels, o tipo VitalityStageKey, o tipo antigo CurrentVitalityInput, resolveCurrentVitalityLevels, calculateVitalityTotal e getCurrentVitalityStage. O import de constantes fica só com DEFAULT_VITALITY_PER_LEVEL. Leve o comentário "type (não interface): atribuível ao índice JSON" para junto de CurrentVitalityValue, se ainda não estiver lá.

lib/calculations/index.test.ts:
- Apague os describes de calculateVitalityLevels, resolveCurrentVitalityLevels, calculateVitalityTotal e getCurrentVitalityStage, os oráculos e as grades restantes da seção de vitalidade antiga, o import de VITALITY_LEVELS e o import do tipo VitalityLevels.
- Tire os quatro nomes de TESTED_FUNCTIONS e mude a contagem para 34.

lib/constants/character.ts: apague VITALITY_LEVELS e VITALITY_LABELS e o comentário "Nomes das vitalidades".

Schemas:
- Em lib/schemas/calculations.ts, acrescente `perLevel: z.number()` a vitalityBaseSchema e troque vitalityLevelsSchema por `currentVitalitySchema = z.object({ current: z.number().nullable() })`.
- Em lib/schemas/character.ts:
  - ajuste o import;
  - defina currentVitalityFieldSchema = currentVitalitySchema.partial().catchall(jsonExtra) e troque o comentário antigo de estágios negativos por: "current ausente ou null = vida cheia. Chaves antigas de estágio (linhas anteriores à regra de total único) caem no catchall: não são mais lidas, mas são preservadas nas gravações";
  - acima de vitalityFieldSchema, comente: "perLevel ausente = 700, resolvido em toVitalityBase".
- Não toque em characterFullSchema (z.any continua) nem nas colunas do Prisma.
- lib/schemas/character.test.ts: acrescente os casos de <behavior>. O caso malformado 'currentVitality leaf string' passa a usar { current: '5' }, porque chaves de estágio agora são JSON livre no catchall. Mantenha o caso legado de seis chaves negativas no teste de entradas tolerantes.

Defaults e página:
- lib/defaults/character.ts: vitality { race: 0, class: 0, perLevel: DEFAULT_VITALITY_PER_LEVEL } (import de '@/lib/constants/character') e currentVitality {}, com o comentário "Sem current: vida cheia (atual = máximo) até a primeira gravação".
- app/character/[id]/page.tsx: o fallback de currentVitality vira `{}`. Mantenha a indentação de 4 espaços.

prisma/schema.prisma, só comentários, sem mudança de coluna:
- acima de vitality: "Vitalidade base: máxima = race + class + perLevel × nível (perLevel ausente = 700)" e "Json: { race: 3500, class: 3500, perLevel: 700 }";
- acima de currentVitality: "Vitalidade atual: total único em current (ausente ou null = vida cheia)", "Linhas antigas ainda trazem as chaves de estágio (notavel, ferido, ...): preservadas, não lidas" e "Json: { current: 9100 }".

Hooks de stats:
- Em lib/store/character.ts (useCalculatedStats), calculatedVitality passa a ser calculateMaxVitality(toVitalityBase(vitality as Partial<VitalityBase>), level), ou null sem vitality.
- Em lib/api/queries.ts (useCalculateDerivedStats), o parâmetro vitality vira Partial<VitalityBase> | null | undefined e calculatedVitality = vitality ? calculateMaxVitality(toVitalityBase(vitality), level) : null. Importe toVitalityBase.
- Nos dois, a chave de retorno continua calculatedVitality e o doc diz que agora é a vitalidade máxima (número).

Gate final: rode o grep de código morto e os quatro comandos do definition of done. Não edite .claude/CLAUDE.md: ele ainda cita a constante de estágio removida como exemplo. Registre isso no SUMMARY como follow-up de documentação.
  </action>
  <verify>
    <automated>! grep -rnE 'calculateVitalityLevels|resolveCurrentVitalityLevels|calculateVitalityTotal|getCurrentVitalityStage|VITALITY_STAGE_DISPLAY|VitalityStageDisplay|VITALITY_LEVELS|VITALITY_LABELS|vitalityLevelsSchema|VitalityStageKey|VitalityLevels|CurrentVitalityInput|fillCurrentVitality' app components lib --include=*.ts --include=*.tsx && npx tsc --noEmit && bun run lint 2>&1 | tee /dev/stderr | grep -q '0 errors, 1 warning' && bun test && bun run build</automated>
  </verify>
  <done>O grep de código morto não encontra nada (eram 171 linhas no HEAD). Os schemas aceitam os formatos antigos e os novos e rejeitam folhas não numéricas. Novos personagens nascem com perLevel 700 e sem current. Os comentários do Prisma descrevem o JSON novo. tsc, lint (0 erros, 1 aviso pré-existente), bun test e bun run build passam.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| navegador → PUT /api/characters/:id | O payload de currentVitality/vitality vem do cliente e é gravado inteiro na coluna Json (sobrescreve a coluna) |
| linha antiga no Postgres → helpers de cálculo | JSON solto de produção (chaves de estágio, campos ausentes, nulos) entra nos cálculos do card, da sheet e da barra |

## STRIDE Threat Register

ASVS nível 1; bloqueia em: high. IDs novos desta tarefa rápida (prefixo T-uyi).

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-uyi-01 | Tampering | gravações de currentVitality (vitality-sheet.tsx, buildUpdateData) | high | mitigate | applyVitalityDamage/applyVitalityHeal/restoreVitality copiam o objeto armazenado e só definem `current`; buildUpdateData espalha a seção existente. Testes em lib/calculations/index.test.ts e components/ui/editable-field.test.ts afirmam que as chaves antigas e desconhecidas sobrevivem e que a entrada não é mutada |
| T-uyi-02 | Tampering | updateCharacterSchema (lib/schemas/character.ts) | medium | mitigate | currentVitality.current é z.number().nullable() e vitality.perLevel é z.number(); folhas não numéricas dão 400 via zValidator. O catchall z.json() mantém o resto como JSON válido. Casos em lib/schemas/character.test.ts |
| T-uyi-03 | Tampering | números derivados (toVitalityBase, resolveCurrentVitality) | medium | mitigate | perLevel ausente, nulo ou não finito vira 700; current não numérico vira o máximo; o máximo nunca vira NaN e o atual nunca fica negativo por dano. Coberto pelos testes de <behavior> da Tarefa 1 |
| T-uyi-04 | Repudiation | linhas antigas sem `current` | low | accept | Decisão do dono: toda ficha existente abre com vida cheia (atual = máximo) depois do deploy; as chaves antigas continuam gravadas para consulta |
| T-uyi-SC | Tampering | npm/pip/cargo installs | high | accept | Nenhuma instalação de pacote neste plano; o gate de legitimidade não se aplica |
</threat_model>

<verification>
Na raiz do repositório, depois da Tarefa 3:
- O grep de código morto da Tarefa 3 não imprime nada.
- `npx tsc --noEmit` sai com 0.
- `bun run lint` imprime "(0 errors, 1 warning)", e o aviso é o de routes, já existente.
- `bun test` passa sem nenhuma falha. A contagem total muda porque os testes de vitalidade foram reescritos; o baseline era 389.
- `bun run build` passa.
- Os human-checks das Tarefas 1 e 2 ficam para a verificação de fim de fase (human_verify_mode = end-of-phase).
</verification>

<success_criteria>
- Máximo = raça + classe + perLevel × nível, com perLevel 700 por padrão. Card, sheet e barra rápida mostram o mesmo atual/máximo.
- O card tem barra única, linha Atual editável e o campo "Por nível"; nenhum vestígio visual de estágios.
- Linhas de produção carregam com vida cheia e todas as gravações preservam as chaves antigas do currentVitality.
- Schemas aceitam os formatos antigos e novos; defaults e comentários do Prisma estão atualizados; nenhuma coluna nem migração muda.
- Definition of done do projeto passa: tsc, lint, test, build.
</success_criteria>

<output>
Create `.planning/quick/261103-uyi-nova-regra-de-vitalidade-raca-classe-por/261103-uyi-SUMMARY.md` when done
</output>
