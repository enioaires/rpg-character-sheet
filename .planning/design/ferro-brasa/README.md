# Design "Ferro & Brasa"

Imported from Claude Design project `de0ca8da-a112-49f4-b775-c8771c15338e` on 2026-11-01.

## Files
- `Ficha.dc.html`: the whole app as one interactive mock. Screens: `lista`, `vazia`, `criar`, `ficha` (tabs `basicos`, `pericias`, `magias`, `anotacoes`), `carregando`, `naoEncontrado`, `erroRede`. It also includes the bottom sheets (`vit`, `berk`, `arma`, `atributos`, `pericias`), the delete alert dialog (`excluir`) and the toasts (`atualizado`, `conflito`, `erro`). Markup is at lines 1-650. Mock logic and data (`renderVals`) start at line 749 and show how each list and state is derived. It uses Lucide icon classes (`icon-*`), which map to `lucide-react` components.
- `ficha-tokens.css`: design tokens with shadcn variable names for light (`:root`) and dark (`.dark`), plus game extras: `--vitality-*` (6 stages), `--berkana*`, `--success`, `--warning`, `--overlay`, `--shadow-card`, `--shadow-lg` and `--font-numeric`.

## Design system rules (from "Design System.dc.html")
- **Fonts:** Spectral for titles (screen title 30/600, card title 19/600), Barlow for text (15-16), and Barlow Semi Condensed with `tabular-nums` for every number (vitality 56, tables 17-24). Labels are 12px uppercase with letter-spacing.
- **Shape:** radius 4px (`--radius: 0.25rem`). Bottom sheets have a 10px top radius. Every card title has a 7px diamond marker (a square rotated 45°) before it.
- **Spacing:** 4px scale. Touch targets are at least 44px, and primary actions are 48-56px.
- **Inline field states:**
  - read-only (plain text)
  - idle editable (1px dashed `--input` border, 44px min height)
  - editing (`--ring` border plus a 3px ring at 30%)
  - saving (spinner `loader-circle`)
  - saved (`--success` border and a check)
  - error (`--destructive` border, `cloud-off` icon and "Não salvou · tentar de novo")
- **Vitality stages:** Notável `heart`, Ferido `heart-crack`, Gravemente Ferido `droplets`, Condenado `skull`, Incapacitado `link`, Coma `moon`. Each stage shows color, icon and position ("3/6"), so color is never the only signal.
- **Berkana states:** Cheia (`sparkles`), Pela metade (`sparkle`, ≤ 50%), Esgotada (`circle-off`, 0), and Disponível otherwise.
- **Toasts:**
  - Conflict: `--warning` border, `refresh-cw` icon, "A ficha foi alterada em outro aparelho" / "Recarregando… sua última edição não foi aplicada."
  - Success: `check` icon in `--success`.
  - Corrupted notes alert: `--destructive` border, 10% destructive tint, `file-warning` icon.
- **Skeleton:** `--muted` blocks with the `ficha-pulse` animation.
- **Dark mode** is the primary mode at the table.

## Screen map (design screen → repo files)
| Screen | Repo files |
| --- | --- |
| Lista | app/characters/page.tsx |
| Criar | app/create/page.tsx |
| Ficha + estados | app/character/[id]/page.tsx, components/forms/character-layout.tsx |
| Barra de ações rápidas | components/character/quick-actions-bar.tsx |
| Básicos / Vitalidade | components/character/basic-info/*.tsx |
| Perícias & Kit | components/character/skills-kit-tab.tsx |
| Magias & Talentos | components/character/spells-talents/*.tsx |
| Anotações | components/character/notes/*.tsx |
| Tokens | app/globals.css |

## Important
The mock data and formulas in `Ficha.dc.html` are illustrative. Real numbers must come from `lib/calculations` and the existing hooks. Never copy the mock's math.
