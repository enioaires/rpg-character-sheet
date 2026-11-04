---
phase: quick-261103-uyi
plan: 01
subsystem: vitalidade
tags: [vitality, calculations, schemas, quick-sheets]
requires: []
provides:
  - calculateMaxVitality, resolveCurrentVitality, applyVitalityDamage/Heal, restoreVitality
  - card Vitalidade de total único com campos Atual e Por nível editáveis
affects:
  - lib/calculations, lib/schemas, lib/defaults, componentes de vitalidade (card, sheet, barra rápida)
tech-stack:
  added: []
  patterns:
    - "currentVitality gravado inteiro, só `current` muda; chaves antigas preservadas"
key-files:
  created:
    - components/ui/editable-field.test.ts
  modified:
    - lib/calculations/index.ts
    - lib/calculations/index.test.ts
    - lib/constants/character.ts
    - lib/schemas/calculations.ts
    - lib/schemas/character.ts
    - lib/schemas/character.test.ts
    - lib/defaults/character.ts
    - lib/store/character.ts
    - lib/api/queries.ts
    - app/character/[id]/page.tsx
    - prisma/schema.prisma
    - components/character/basic-info/basic-info-model.ts
    - components/character/basic-info/basic-info-model.test.ts
    - components/character/basic-info/vitality-card.tsx
    - components/character/basic-info-tab.render.test.ts
    - components/character/quick-sheets/vitality-sheet.tsx
    - components/character/quick-actions-bar.tsx
    - components/character/quick-actions.render.test.ts
    - components/character/resource-display.ts
    - components/ui/editable-field.tsx
decisions:
  - "Vitalidade máxima = race + class + perLevel × nível; perLevel ausente/nulo/não finito = 700 (0 gravado continua 0)"
  - "current ausente ou null = vida cheia; sem teto (atual acima do máximo é mantido, Cura nunca reduz)"
  - "Novos personagens nascem com currentVitality {} para a vida acompanhar o máximo até a primeira gravação"
  - "Badge neutro 'Sem vitalidade definida' só quando máximo <= 0; barra única em vitality-notavel sobre vitality-track"
metrics:
  tasks: 3
  completed: 2026-11-03
status: complete
actuals:
  tokens: 60000
  tasks: 3
  commits: 3
plan_head_before: a17dd70a2a2a212d9fb8b410547c69d9ec8fda47
plan_head_after: 7ef2134b2c5ed270a9a0a7402bfadbd8bfaa1b42
---

# Phase quick-261103-uyi Plan 01: Nova regra de vitalidade Summary

Vitalidade em total único (raça + classe + por nível × nível, com por nível editável e padrão 700), atual em `currentVitality.current` (ausente ou null = vida cheia), com as chaves antigas de estágio preservadas em toda gravação.

## Tarefas

| Tarefa | Commit | Resumo |
| ------ | ------ | ------ |
| 1 (tracer) | 75329e6 | Helpers novos, `toVitalityBase` com `perLevel`, `buildVitalityView` e card com barra única, linha Atual e campo Por nível; `buildUpdateData` exportado e testado |
| 2 | 6ccd0a0 | Dano/Cura/Restaurar no total único com payload completo; sheet e barra rápida sem estágio; mapa de estágios removido |
| 3 | 7ef2134 | Schemas (`perLevel`, `current`), defaults, página, comentários do Prisma, hooks de stats; remoção de todo o código de estágios |

O gate do tracer (Tarefa 1) foi reexecutado ponta a ponta (testes dos quatro arquivos e tsc) antes de seguir; passou.

## Verificação final

- `npx tsc --noEmit`: passa
- `bun run lint`: 0 erros, 1 aviso (o `routes` pré-existente)
- `bun test`: 382 pass, 0 fail (baseline 389; a contagem caiu porque os testes de estágio e os oráculos congelados saíram)
- `bun run build`: passa
- Grep de código morto de estágios em `app`, `components`, `lib`: sem resultados

## Deviations from Plan

None - plano executado como escrito. Dois ajustes pequenos de teste, sem mudar comportamento:
- `basic-info-tab.render.test.ts` tinha um segundo teste (tab desbloqueada) que esperava '13.160'; trocado por '1.070'.
- Durante a Tarefa 2, `VIT_DAMAGE_GRID` ficou sem uso (aviso de lint) até a Tarefa 3 removê-lo junto com as grades antigas.

## Follow-ups

- `.claude/CLAUDE.md` ainda cita `VITALITY_LEVELS` / `calculateVitalityLevels` / `VitalityLevels` como exemplos (convenções, arquitetura). Atualizar a documentação; não editado por ordem do plano.
- Human-checks pendentes (fim de fase): card Vitalidade a 375px; barra rápida e sheet (100 de dano, 100 de cura, Restaurar, recarregar a ficha).
- Toda ficha existente abre com vida cheia depois do deploy (decisão do dono, T-uyi-04).

## Known Stubs

Nenhum.

## Threat Flags

Nenhum.

## Self-Check: PASSED

- Arquivos: `components/ui/editable-field.test.ts` e este SUMMARY existem
- Commits 75329e6, 6ccd0a0 e 7ef2134 presentes no histórico de master
