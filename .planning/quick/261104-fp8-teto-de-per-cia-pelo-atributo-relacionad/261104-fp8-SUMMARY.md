---
phase: quick-261104-fp8
plan: 01
subsystem: skills-kit
tags: [skills, attributes, cap, calculations, ui]
requires: []
provides:
  - SKILL_ATTRIBUTES, ATTRIBUTE_ABBREVIATIONS, SkillKey, AttributeKey (lib/constants/character.ts)
  - getSkillDistributionCap, StoredAttributes (lib/calculations)
  - SkillRowModel.max / attributeAbbr / isOverCap; buildSkillStepUpdate distributedCap
affects: [components/character/skills-kit]
tech-stack:
  added: []
  patterns: [Record<SkillKey, AttributeKey> para exigir cobertura total em tempo de compilação]
key-files:
  created: []
  modified:
    - lib/constants/character.ts
    - lib/calculations/index.ts
    - lib/calculations/index.test.ts
    - components/character/skills-kit/skills-kit-model.ts
    - components/character/skills-kit/skills-kit-model.test.ts
    - components/character/skills-kit/skills-card.tsx
    - components/character/skills-kit/skill-row.tsx
    - components/character/skills-kit/skill-stepper.tsx
    - components/character/skills-kit-tab.render.test.ts
decisions:
  - "Teto de distribuídos = max(0, total do atributo relacionado), mesmo número do card de atributos; bônus e base da perícia não contam"
  - "Valor acima do teto nunca é recortado: só marcado em vermelho; o + trava e o - funciona"
  - "components/ui/editable-field.tsx não mudou: EditableNumberField já aceita max"
  - "oficios usa inteligencia (ESP da tabela confirmado como INT)"
status: complete
commits: 3
plan_head_before: ba60386bf760fe9f6413b05d182973e417f7fb24
plan_head_after: dd9de6663a7598738c00b7b46f34a306aa09b2a9
actuals:
  tokens: 22000
  tasks: 3
  commits: 3
completed: 2026-11-04
---

# Quick 261104-fp8: Teto de perícia pelo atributo relacionado Summary

Os pontos distribuídos de cada perícia têm teto igual ao total do atributo relacionado (tabela do dono), com legenda "máx N · SIGLA", + travado no teto, digitação limitada e valor vermelho acima do teto sem reescrever dados.

## Commits

- 32f7b5e: constantes (SKILL_ATTRIBUTES, ATTRIBUTE_ABBREVIATIONS) e getSkillDistributionCap, com testes (exports 34 para 35)
- 79936f4: modelo (max, attributeAbbr, isOverCap), buildSkillStepUpdate com distributedCap, card repassando attributes e row.max
- dd9de66: linha (legenda, detalhe vermelho), stepper (max, isOverCap, + travado) e testes de render

## Verificação

- `npx tsc --noEmit`: passou
- `bun run lint`: 0 errors, 1 warning (aviso pré-existente de `routes`)
- `bun test`: 406 pass, 0 fail (baseline 382)
- `bun run build`: passou

O human-check (conferir na ficha em `bun dev`) fica para a verificação de fim de fase.

## Deviations from Plan

None - plan executed exactly as written. Observação de processo: os commits por tarefa foram agrupados por arquivo (3 commits), e os testes foram escritos junto da implementação em vez de em ciclos RED/GREEN separados.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

Arquivos modificados verificados no git; commits 32f7b5e, 79936f4 e dd9de66 presentes em master.
