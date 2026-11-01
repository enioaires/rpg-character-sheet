---
phase: quick-261101-iik
plan: 01
type: execute
wave: 6                     # advisory only; recomputed by `quick-batch update` from depends_on / files_modified (chain iie→iif→iig→iii→iij→iik)
depends_on: ["261101-iig", "261101-iii", "261101-iij"]
files_modified:
  - lib/notes.ts
  - lib/notes.test.ts
  - components/character/notes-tab.tsx
  - components/character/notes-tab.render.test.ts
autonomous: true
requirements: [NOTE-01]

must_haves:
  truths:
    - "Opening a character whose notes column holds legacy plain text, in edit mode, converts it into exactly one note titled 'Anotações Antigas' with the trimmed text as content, and the migration PUT is issued at most once per character per page session — including under React Strict Mode double-invoked effects and across re-renders while the PUT is in flight"
    - "Opening a character whose notes column is corrupted (unparseable JSON, JSON that is not an array, an array whose items are not notes, or a non-string value) shows a non-destructive notice with the original content rendered as plain text, and no add/edit/delete/reorder write is sent that could replace it"
    - "While the notes column still holds un-migrated legacy text, no add/edit/delete/reorder write can replace it (the legacy text is shown read-only until the one-time migration lands)"
    - "While canWriteNotes(parsed) is false (corrupted or un-migrated legacy), the list area shows only the notice card: the 'Nenhuma anotação ainda' empty state is not rendered (the tab never claims the list is empty when the stored value is unreadable), and neither the 'Nova Anotação' trigger nor the 'Criar primeira anotação' button is offered, in view or edit mode"
    - "Valid notes load, add, edit, delete, reorder and search exactly as before (same toasts, same ids/timestamps format, same order semantics)"
    - "Parsing, legacy migration and serialization of the notes String column live only in lib/notes.ts; components/character/notes-tab.tsx contains no raw JSON parse/stringify calls"
    - "prisma/schema.prisma still declares `notes String?` — no column type change, no schema push"
  artifacts:
    - path: "lib/notes.ts"
      provides: "Single source of truth for the notes String column: note schema/type, parse (ok/empty/legacy/corrupted), legacy migration, serialization, write guard, reorder helper, one-time migration claim"
      exports: ["noteSchema", "Note", "ParsedNotes", "parseNotes", "serializeNotes", "createNote", "migrateLegacyNotes", "canWriteNotes", "moveNote", "claimLegacyMigration"]
    - path: "lib/notes.test.ts"
      provides: "bun:test unit tests for every export of lib/notes.ts"
      contains: "bun:test"
    - path: "components/character/notes-tab.tsx"
      provides: "Notes tab consuming lib/notes.ts: memoized parse, effect-driven one-time legacy migration, guarded writes, non-destructive notice card"
    - path: "components/character/notes-tab.render.test.ts"
      provides: "Render tests created by 261101-iij, extended here with the corrupted/legacy notice and create-control assertions (Tests F-H)"
      contains: "Não foi possível ler as anotações"
  key_links:
    - from: "components/character/notes-tab.tsx"
      to: "lib/notes.ts"
      via: "named imports from @/lib/notes"
      pattern: "from [\"']@/lib/notes[\"']"
    - from: "components/character/notes-tab.tsx (useEffect)"
      to: "lib/notes.ts claimLegacyMigration -> useUpdateCharacter().mutateAsync"
      via: "legacy migration effect claims the (characterId, legacyText) key before the single PUT"
      pattern: "claimLegacyMigration\\("
    - from: "components/character/notes-tab.tsx (write handlers)"
      to: "lib/notes.ts canWriteNotes + serializeNotes"
      via: "every notes write is guarded by canWriteNotes and serialized by serializeNotes"
      pattern: "canWriteNotes\\("
    - from: "components/character/notes-tab.tsx (list area + header actions)"
      to: "parsed.status / canWrite"
      via: "the notice card replaces the empty-state branch when !canWrite, and the Nova Anotação dialog block renders only when isEditMode && canWrite; asserted by renderToString Tests F-H"
      pattern: "Não foi possível ler as anotações"
---

<objective>
Centralize all logic for the `notes` String column (NOTE-01) in a new shared util `lib/notes.ts`: parsing into a typed result (ok / empty / legacy / corrupted), migrating legacy plain text into a single note, serializing, and guarding writes. `components/character/notes-tab.tsx` consumes it so that (1) the legacy migration fires at most once even under React Strict Mode, (2) corrupted or un-migrated data is shown in a non-destructive state and is never overwritten by the next add/edit/delete/reorder, and (3) the Prisma `notes` column stays `String?`.

Purpose: Core value is "no lost edits". Today a corrupted `notes` value is silently replaced by the next add, and legacy migration is fired from render. This plan makes the notes data path explicit, typed and unit-tested.
Output: `lib/notes.ts`, `lib/notes.test.ts`, refactored `components/character/notes-tab.tsx`, and `components/character/notes-tab.render.test.ts` (created by 261101-iij) extended with the corrupted/legacy UI assertions this item owns.

Sequencing (depends_on): runs after 261101-iij (moves render-time setState/migration of notes-tab into effects, removes console.log), 261101-iii (concurrency-aware `useUpdateCharacter` — the migration write must go through it, per ROADMAP Phase 3 planning note) and 261101-iig (bun test script + `bun:test` typing). Later siblings 261101-iil (XSS in `renderFormattedText`) and 261101-iin (component split) run after this one — do NOT touch `renderFormattedText` or split the component here.
</objective>

<execution_context>
@~/.claude/gsd-core/workflows/execute-plan.md
@~/.claude/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@components/character/notes-tab.tsx
@components/character/types.ts
@lib/api/queries.ts
@lib/calculations/index.ts

Sibling summaries to read first if present (they describe the exact state of notes-tab.tsx and `useUpdateCharacter` you start from):
- .planning/quick/261101-iij-fix-react-correctness-bugs-bug-01-bug-02-no-conditional-hook/261101-iij-SUMMARY.md
- .planning/quick/261101-iii-optimistic-concurrency-api-02-useupdatecharacter-sends-the-u/261101-iii-SUMMARY.md
- .planning/quick/261101-iig-add-unit-tests-calc-02-bun-test-suite-for-every-exported-fun/261101-iig-SUMMARY.md

Facts verified at planning time (HEAD 832fa9b):
- `prisma/schema.prisma` line 86: `notes String?`. Server schemas (`lib/schemas/character.ts`) treat notes as `z.string()` — unchanged by this plan.
- Every note ever written by the app (git history of notes-tab.tsx) has exactly the string fields id, title, content, createdAt, updatedAt; ids are `Date.now()` as a decimal string.
- `useUpdateCharacter` (lib/api/queries.ts) takes `{ id, data }` and on success writes the response into the `['character', id]` query cache, so a successful migration flips `character.notes` to JSON and the parse result to `ok`. 261101-iii may add the last-seen `updatedAt` to this call — mirror whatever calling convention the other handlers in notes-tab.tsx use after it lands.
- TanStack Query v5 `mutateAsync` is referentially stable; Next.js App Router enables React Strict Mode in dev, so effects run mount → cleanup → mount.
- Zod is 4.0.10: `z.looseObject({...})` keeps unknown keys (`.passthrough()` is deprecated).
- Baselines: `npx tsc --noEmit` exit 0 (~1s); `bun run build` exit 0 (~8s, no DB needed).

<interfaces>
Target contract for lib/notes.ts (implement exactly these names/signatures):

```ts
export const noteSchema // z.looseObject({ id: z.string(), title: z.string(), content: z.string(), createdAt: z.string(), updatedAt: z.string() })
export type Note = z.infer<typeof noteSchema>

export type ParsedNotes =
  | { status: 'empty'; notes: Note[] }                       // null/undefined/blank string
  | { status: 'ok'; notes: Note[] }                          // JSON array (or real array) of valid notes, incl. []
  | { status: 'legacy'; notes: Note[]; legacyText: string }  // non-empty string not starting with [ or {  (notes = [])
  | { status: 'corrupted'; notes: Note[]; raw: string }      // anything else (notes = [])

export function parseNotes(raw: unknown): ParsedNotes
export function serializeNotes(notes: Note[]): string
export function createNote(input: { title: string; content: string }, now?: Date): Note
export function migrateLegacyNotes(legacyText: string, now?: Date): Note[]
export function canWriteNotes(parsed: ParsedNotes): boolean            // true only for 'ok' | 'empty'
export function moveNote(notes: Note[], id: string, direction: 'up' | 'down'): Note[] | null  // null = no-op
export function claimLegacyMigration(characterId: string, legacyText: string): boolean      // true only the first time per pair
```
</interfaces>
</context>

<tasks>

<task type="tracer" tdd="true">
  <name>Task 1 (tracer): notes column → lib/notes.ts parse → one-time legacy migration → useUpdateCharacter, end to end</name>
  <precondition>261101-iig has landed: package.json has a "test" script and `npx tsc --noEmit` passes with iig's bun:test test files in the tree (so a colocated lib/notes.test.ts importing from "bun:test" typechecks). If bun:test types do not resolve, halt and report — package.json/tsconfig.json/bun.lock are owned by 261101-iig and are not in this plan's files_modified.</precondition>
  <files>lib/notes.ts, lib/notes.test.ts, components/character/notes-tab.tsx</files>
  <behavior>
    - parseNotes(null), parseNotes(undefined), parseNotes(""), parseNotes("   ") → status 'empty', notes []
    - parseNotes of a serialized array of two valid notes → status 'ok', notes deep-equal the input, in order; an extra unknown key on a note is preserved
    - parseNotes of an actual array of valid notes (not a string) → status 'ok' (keeps today's "already an array" branch)
    - parseNotes("[]") → status 'ok', notes []
    - parseNotes("  Minhas anotações\nlinha 2  ") → status 'legacy', legacyText "Minhas anotações\nlinha 2", notes []
    - parseNotes('{"a":1}') → 'corrupted' with raw equal to the original string; parseNotes('[{"id":"1"') (malformed) → 'corrupted'; parseNotes('[1,2]') and parseNotes('[{"id":"1","title":"x"}]') (items missing note fields) → 'corrupted'; parseNotes(42) → 'corrupted' with a string raw
    - serializeNotes(notes) round-trips: parseNotes(serializeNotes(notes)) is 'ok' with deep-equal notes; serializeNotes([]) === "[]"
    - migrateLegacyNotes("  texto antigo  ", fixedDate) → exactly one note: title "Anotações Antigas", content "texto antigo", id === String(fixedDate.getTime()), createdAt === updatedAt === fixedDate.toISOString(); serializing it and parsing back gives 'ok' with 1 note
    - claimLegacyMigration("char-A", "txt") → true, then the same call → false (second Strict-Mode effect run); claimLegacyMigration("char-B", "txt") → true; claimLegacyMigration("char-A", "outro") → true (use unique ids per test — the guard is module-scoped)
  </behavior>
  <action>
    RED first: create lib/notes.test.ts with describe/test/expect imported from "bun:test", covering every behavior bullet above for parseNotes, serializeNotes, migrateLegacyNotes and claimLegacyMigration; run it and confirm it fails because lib/notes.ts does not exist. Follow the test style 261101-iig established for lib/calculations (read its test file first).

    GREEN: create lib/notes.ts (if a sibling already created it, extend it to this contract instead of recreating). Header comment "// lib/notes.ts", pt-BR comments, style of lib/calculations/index.ts (2-space indent, single quotes, no semicolons), import z from 'zod'. Implement per the <interfaces> contract:
    - noteSchema with z.looseObject so unknown keys survive a read→write round trip (non-destructive); Note inferred from it (project convention: types inferred from Zod).
    - parseNotes keeps today's classification rules exactly: null/undefined → empty; a real array → validate; non-string non-array → corrupted; string trimmed empty → empty; trimmed string starting with "[" or "{" → try to parse it as JSON inside try/catch, an array whose every item passes noteSchema.safeParse → ok (return the parsed items), anything else (object, parse error, invalid item) → corrupted with raw = the original string; any other non-empty string → legacy with legacyText = the trimmed string. For non-string corrupted input build raw by JSON-encoding the value, falling back to String(value). Never throw, never log.
    - serializeNotes: the single place notes are turned into the column string (JSON array text).
    - migrateLegacyNotes(legacyText, now = new Date()): returns a one-element array built by createNote-style logic with title "Anotações Antigas" and content legacyText.trim(); one `now` for id/createdAt/updatedAt so createdAt === updatedAt (fixes the "Editado" label flicker caused by two separate Date calls).
    - createNote(input, now = new Date()): trimmed title/content, id String(now.getTime()) (same id format as today), createdAt = updatedAt = now.toISOString(). (Used by Task 2; implement here because migrateLegacyNotes shares it.)
    - claimLegacyMigration(characterId, legacyText): module-level Set keyed by characterId plus a NUL separator plus legacyText; returns true and records the key the first time, false afterwards. Module scope (not a component ref) is deliberate: it survives Strict Mode's mount→cleanup→mount AND a tab unmount/remount while the PUT is in flight, so the migration fires at most once per page session. No release on failure — no automatic retry loop; a reload retries.

    WIRE notes-tab.tsx (start from the file as 261101-iij left it; read it fully first):
    - Delete the local Note interface; import type Note and the functions from "@/lib/notes" (this file uses double quotes + semicolons — keep its style).
    - Replace the notes parsing block (the render-time IIFE at HEAD, or the useMemo/derived-state block 261101-iij introduced) with a single memo: parsed = useMemo(() => parseNotes(character.notes), [character.notes]); allNotes = parsed.notes. No setState and no side effects during render.
    - Replace the old migration function `migrateOldNotes`, its state `hasMigratedOldNotes`, and any ref/effect 261101-iij added for it, with ONE useEffect: return early unless isEditMode is true and parsed.status is 'legacy'; return early unless claimLegacyMigration(characterId, parsed.legacyText) returns true; then call the update mutation's mutateAsync exactly the way the other handlers in this file call it after 261101-iii (concurrency-aware path, including any last-seen updatedAt it requires) with data.notes = serializeNotes(migrateLegacyNotes(parsed.legacyText)); on success toast.success("Anotações antigas migradas com sucesso!") (same text as today); on failure keep a console.error and add toast.error("Erro ao migrar anotações antigas. Recarregue a página para tentar novamente."). Effect deps: isEditMode, parsed, characterId, mutateAsync. Migration still only runs in edit mode (unchanged behavior). Do not leave comments that mention the removed names.
    - Replace whichever corrupted-data flag exists — the HEAD useState pair with its setter calls, or the memo-derived hasCorruptedData that 261101-iij introduced — with parsed.status === "corrupted" (no separate flag, no setter); the dev-only "Limpar Dados Corrompidos" button now shows when process.env.NODE_ENV === "development" and parsed.status === "corrupted" and isEditMode (its write is converted in Task 2).
    - Leave the add/edit/delete/move handlers, renderFormattedText (owned by 261101-iil) and all JSX layout otherwise untouched in this task.
    - Prisma schema is NOT touched (notes stays String?; no schema push).
    <!-- planner-discipline-allow: migrateOldNotes -->
    <!-- planner-discipline-allow: hasMigratedOldNotes -->
  </action>
  <verify>
    <automated>bun test ./lib/notes.test.ts && npx tsc --noEmit && grep -qE "from ['\"]@/lib/notes['\"]" components/character/notes-tab.tsx && grep -q 'parseNotes(' components/character/notes-tab.tsx && grep -q 'claimLegacyMigration(' components/character/notes-tab.tsx && grep -q 'useEffect' components/character/notes-tab.tsx && test "$(grep -cE 'migrateOldNotes|hasMigratedOldNotes' components/character/notes-tab.tsx)" -eq 0 && test "$(grep -c 'setHasCorruptedData' components/character/notes-tab.tsx)" -eq 0 && test "$(grep -cE '^interface Note \{' components/character/notes-tab.tsx)" -eq 0</automated>
    <!-- Gate semantics hold for both possible start states (HEAD 832fa9b, or the tree 261101-iij leaves). Discriminating presence gates — @/lib/notes import, parseNotes(, claimLegacyMigration( — are 0 at HEAD and still 0 after iij (iij does not create lib/notes.ts), so they fail until this task lands. Absence gates — migrate identifiers (5 at HEAD), setHasCorruptedData (2 at HEAD), local interface Note (1 at HEAD) — may already be 0 after iij (it removes the setter and may remove the migration names); they are regression guards that must be 0 at the end either way. The useEffect check is likewise a regression guard (0 at HEAD, already present after iij). lib/notes.ts and lib/notes.test.ts absent in both states. -->
  </verify>
  <done>lib/notes.ts exports noteSchema, Note, ParsedNotes, parseNotes, serializeNotes, createNote, migrateLegacyNotes, claimLegacyMigration; their bun tests pass; notes-tab.tsx parses via a memoized parseNotes, has no render-time side effects, and runs the legacy migration from one effect gated by claimLegacyMigration through the concurrency-aware update mutation; tsc passes. Committed.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: route every notes write through lib/notes.ts with a write guard and a non-destructive notice for corrupted/legacy data</name>
  <files>lib/notes.ts, lib/notes.test.ts, components/character/notes-tab.tsx, components/character/notes-tab.render.test.ts</files>
  <behavior>
    - canWriteNotes is true for parseNotes(null) and parseNotes('[]'), false for parseNotes('texto antigo') (legacy) and parseNotes('{"x":1}') (corrupted)
    - createNote({ title: "  T  ", content: "  C  " }, fixedDate) → title "T", content "C", id String(fixedDate.getTime()), createdAt === updatedAt === fixedDate.toISOString()
    - moveNote([a,b,c], "b", "up") → [b,a,c]; moveNote([a,b,c], "b", "down") → [a,c,b]; input array is not mutated
    - moveNote([a,b,c], "a", "up") → null; moveNote([a,b,c], "c", "down") → null; moveNote([a,b,c], "zzz", "up") → null and "down" → null (same no-op rules as today's moveNoteUp/moveNoteDown)
    - Render Test F (components/character/notes-tab.render.test.ts): renderToString of NotesTab with notes = '{"x":"<img src=x onerror=alert(1)>"}' (corrupted) and isEditMode true → HTML contains "Não foi possível ler as anotações" and the escaped text "&lt;img src=x onerror=alert(1)&gt;", contains no "<img", and contains none of "Nenhuma anotação ainda", "Criar primeira anotação", "Nova Anotação"; zero mutateAsync calls
    - Render Test G: notes = "Texto antigo do personagem" (legacy), rendered once with isEditMode false and once with isEditMode true → each HTML contains "Anotações em formato antigo" and "Texto antigo do personagem", and none of "Nenhuma anotação ainda", "Criar primeira anotação", "Nova Anotação"; zero mutateAsync calls (effects do not run under renderToString)
    - Render Test H (control): notes = "[]" with isEditMode true → HTML contains "Nenhuma anotação ainda", "Criar primeira anotação" and "Nova Anotação" (proves the F/G negative assertions can detect those strings, and that writable data keeps today's empty state)
  </behavior>
  <action>
    RED: extend lib/notes.test.ts with the canWriteNotes/createNote/moveNote behavior bullets, and add Render Tests F-H to components/character/notes-tab.render.test.ts (the file 261101-iij created). Reuse its existing mock.module("@/lib/api/queries") registration, dynamic import of NotesTab and per-test mockClear — do not add a second mock of that module. Confirm the new tests fail: F and G fail at the start state because the empty state and create controls still render for corrupted/legacy data. This item owns every assertion about the corrupted/legacy UI. If 261101-iij's Test E as merged still asserts the "Nenhuma anotação ainda" copy for malformed JSON, change that one assertion to the corrupted notice (keep its no-write/render-purity checks); leave iij's other tests untouched.

    GREEN in lib/notes.ts: add canWriteNotes (true only for status 'ok' or 'empty') and moveNote (find index; 'up' with index <= 0 or not found → null; 'down' with index >= length - 1 or not found → null; otherwise return a new array with the two neighbours swapped). createNote already exists from Task 1 — make sure its tests now cover it.

    WIRE notes-tab.tsx:
    - const canWrite = canWriteNotes(parsed).
    - handleAddNote: keep the existing empty-title/content validation and toasts; if !canWrite, toast.error and return without calling the mutation; otherwise write serializeNotes([...allNotes, createNote({ title: newNoteTitle, content: newNoteContent })]).
    - handleEditNote / handleDeleteNote: same canWrite guard; keep today's map (title/content trimmed, updatedAt = new ISO timestamp) and filter logic; serialize with serializeNotes.
    - moveNoteUp / moveNoteDown: same canWrite guard; use moveNote(allNotes, noteId, direction); if it returns null return early with no PUT (unchanged behaviour); else write serializeNotes(result). Keep the two handler names and their onClick call sites so the JSX diff stays small for 261101-iin.
    - clearCorruptedNotes (dev-only, explicit user click): write serializeNotes([]).
    - Guard toast copy (pt-BR): corrupted → "As anotações salvas estão corrompidas. Nenhuma alteração será salva para não sobrescrever o conteúdo original."; legacy → "Aguarde a conversão das anotações antigas.".
    - All mutation calls keep the calling convention 261101-iii established (last-seen updatedAt etc.).
    - After this task the component contains no raw JSON parse/stringify calls at all — every column read goes through parseNotes and every write through serializeNotes.
    - Non-destructive notice: in the list area, make the notice Card the FIRST branch of the existing conditional chain, so it renders INSTEAD OF the rest of the chain whenever canWrite is false (parsed.status 'corrupted' or 'legacy'), in both view and edit mode. The chain becomes: !canWrite → notice card; otherwise the unchanged chain (allNotes.length === 0 → the "Nenhuma anotação ainda" empty-state card with its "Criar primeira anotação" button; no search results → "Nenhuma anotação encontrada"; else the list). At HEAD the empty-state branch is gated only on allNotes.length === 0, and parseNotes returns notes [] for corrupted/legacy, so without this ordering the tab would show the notice AND claim the list is empty AND offer an active create button. After the change the empty-state card (and its button) is reachable only when status is 'ok' or 'empty'. Corrupted: title "Não foi possível ler as anotações", text explaining the saved content was preserved and no change will be saved until it is fixed, then parsed.raw. Legacy: title "Anotações em formato antigo", text "Este conteúdo será convertido em uma anotação ao entrar no modo de edição.", then parsed.legacyText. Render that content ONLY as a React text child of a pre element (classes like whitespace-pre-wrap break-words font-mono text-xs bg-muted rounded p-3 max-h-64 overflow-auto) — never via renderFormattedText or dangerouslySetInnerHTML (it is untrusted, unvalidated content). Use the existing Card/CardHeader/CardTitle/CardContent imports and an existing lucide icon (e.g. FileText); no new dependencies.
    - Change the header's isEditMode condition that wraps the whole "Nova Anotação" Dialog block (trigger plus content) to isEditMode && canWrite. The only other opener of that dialog is the empty-state "Criar primeira anotação" button, which the previous bullet makes unreachable while !canWrite. So no create control is offered for corrupted or un-migrated legacy data, and handleAddNote's canWrite guard stays as defense in depth.
    - Do not touch renderFormattedText (261101-iil) and do not split the component (261101-iin).
  </action>
  <verify>
    <automated>bun test ./lib/notes.test.ts && bun test components/character/notes-tab.render.test.ts && npx tsc --noEmit && test "$(grep -cE 'JSON\.(parse|stringify)\(' components/character/notes-tab.tsx)" -eq 0 && grep -q 'canWriteNotes(' components/character/notes-tab.tsx && grep -q 'serializeNotes(' components/character/notes-tab.tsx && grep -q 'createNote(' components/character/notes-tab.tsx && grep -q 'moveNote(' components/character/notes-tab.tsx && test "$(grep -cE '^\s*notes\s+String\?' prisma/schema.prisma)" -eq 1 && bun test && bun run build</automated>
    <!-- Baselines (hold at HEAD 832fa9b and after 261101-iij, which keeps the inline parse and does not create lib/notes.ts): raw JSON parse/stringify calls in notes-tab.tsx > 0 (8 at HEAD); canWriteNotes( 0; serializeNotes( 0; createNote( 0; moveNote( 0 (moveNoteUp/moveNoteDown do not match); prisma notes String? 1 (invariant — must stay 1). Render Tests F and G fail at the start state; H passes (control). The full `bun test` run includes 261101-iij's NotesTab render tests A-E in the same file (A-C, D: no mutation and no log-level console calls during render; E: no write for malformed JSON) as well as 261101-iig's suites — all must stay green. `bun run lint` is NOT a gate for this item by batch design: ESLint config and react-hooks rules (e.g. exhaustive-deps on the migration effect) arrive with 261101-iim, which runs lint over this code afterwards. -->
    <human-check>End-of-phase UAT on a throwaway test character (dev server `bun dev`, which runs React Strict Mode; edit the notes cell with `bunx prisma studio`): (a) set notes to plain text "texto antigo", open the character, enter edit mode → the Network tab shows exactly ONE PUT, the tab shows exactly one note "Anotações Antigas", one success toast; (b) set notes to {"oops":1} → the corrupted notice shows the raw text literally; there is no "Nenhuma anotação ainda" empty state, no "Criar primeira anotação" button and no "Nova Anotação" button (in edit mode too), and no PUT is sent; switching tabs/modes does not change the cell; (c) a character with normal notes: add, edit, delete, move up/down and search behave exactly as before.</human-check>
  </verify>
  <done>All notes writes in notes-tab.tsx go through serializeNotes and are refused (toast, no PUT) while the data is corrupted or un-migrated legacy text. Corrupted/legacy content is displayed read-only as plain text, in a notice that replaces the empty state, with no "Nova Anotação" or "Criar primeira anotação" control offered (Render Tests F-H pass). Reorder uses moveNote with unchanged no-op rules. lib/notes.ts tests cover every export. Full `bun test` (including 261101-iij's render tests), `npx tsc --noEmit` and `bun run build` pass. prisma/schema.prisma is unchanged. Committed.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| DB/API → browser | The `notes` string comes from the open (no-auth, accepted decision) API; any client can store arbitrary text in it, so it is untrusted input to parseNotes and to whatever renders it |
| browser → API (PUT /api/characters/:id) | Notes writes serialize the whole array; a wrong write destroys data in a single request |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-261101-iik-01 | Tampering (data integrity) | notes-tab write handlers | high | mitigate | canWriteNotes guard in add/edit/delete/move refuses writes (toast, no PUT) for 'corrupted' and 'legacy' parse results; the "Nova Anotação" dialog block and the empty-state "Criar primeira anotação" button are rendered only when writable (notice card replaces the empty state); unit tests assert canWriteNotes is false for both states and Render Tests F-G assert the create controls are absent |
| T-261101-iik-02 | Information disclosure / XSS | non-destructive notice card | high | mitigate | Raw corrupted/legacy content is rendered only as a React text child of a pre element (auto-escaped), never via renderFormattedText/dangerouslySetInnerHTML; Render Test F asserts an injected img tag comes out escaped; the note-body formatter XSS itself is fixed by sibling 261101-iil (transfer) |
| T-261101-iik-03 | Denial of service | parseNotes | low | mitigate | Parse is wrapped in try/catch and validated with noteSchema.safeParse — malformed JSON, non-array JSON or items missing fields yield 'corrupted' instead of throwing/crashing the tab (today a malformed item crashes on `.replace`/`.toLowerCase`) |
| T-261101-iik-04 | Tampering (duplicate writes) | legacy migration effect | medium | mitigate | Migration runs from one useEffect (never during render), gated by module-scoped claimLegacyMigration so Strict Mode double effects and remounts cannot fire a second PUT; write goes through the concurrency-aware useUpdateCharacter (261101-iii), so a stale write gets 409 instead of overwriting |
| T-261101-iik-05 | Spoofing / Elevation of privilege | /api/characters (no auth) | low | accept | Project decision: no authentication, trusted play group; out of scope |
| T-261101-iik-SC | Tampering | npm/bun installs | low | accept | No packages are installed by this plan (uses existing zod 4.0.10); package.json/bun.lock untouched |
</threat_model>

<verification>
- `bun test` — all suites green, including lib/notes.test.ts (every lib/notes.ts export covered) and components/character/notes-tab.render.test.ts (261101-iij's Tests A-E plus this item's F-H).
- `npx tsc --noEmit` exit 0.
- `bun run build` exit 0.
- `grep -cE '^\s*notes\s+String\?' prisma/schema.prisma` → 1 (column type unchanged); `git diff --stat` for this plan's commits lists only lib/notes.ts, lib/notes.test.ts, components/character/notes-tab.tsx, components/character/notes-tab.render.test.ts.
- No raw JSON parse/stringify calls remain in components/character/notes-tab.tsx; it imports from @/lib/notes.
- `bun run lint` is NOT a gate for this item. By batch design lint is deferred to 261101-iim, which adds the ESLint flat config and react-hooks rules and lints this code once all items have landed.

Source coverage audit:
| Source | Item | Covered by |
|--------|------|------------|
| REQ | NOTE-01 shared util for parse / legacy migration / serialize, used by notes tab | Task 1 (util + wiring), Task 2 (all writes) |
| REQ | NOTE-01 notes column stays String | Task 2 verify invariant; no prisma edit |
| REQ | NOTE-01 corrupted data never silently overwritten | Task 2 (canWriteNotes guard + notice) |
| REQ | NOTE-01 legacy migration fires at most once | Task 1 (claimLegacyMigration + effect, unit-tested) |
| GOAL | ROADMAP Phase 3 SC2 (exactly one note, Strict Mode safe) | Task 1 |
| GOAL | ROADMAP Phase 3 SC3 (non-destructive corrupted state) | Task 2 (write guard, notice replaces empty state, create controls gated on canWrite; Render Tests F-H) |
| GOAL | ROADMAP Phase 3 SC4 (one shared util, column unchanged) | Tasks 1-2 |
| GOAL | ROADMAP Phase 3 note: migration via concurrency-aware path, effect + guard | Task 1 (depends_on 261101-iii) |
| CONTEXT | No auth, no Prisma type change, behavior identical except fixes, Bun | Threat T-05 accept; no prisma/package edits; unchanged toasts/ids/no-op rules |
| RESEARCH | none (no RESEARCH.md for quick-batch item) | — |
| Out of scope here | renderFormattedText escaping (261101-iil), component split (261101-iin), console.log cleanup / editable-field hook (261101-iij) | sibling items |

Discretion choices (documented): note items require all five string fields (matches every note the app has ever written); unknown keys preserved via z.looseObject; legacy text is shown read-only in view mode instead of an empty state (non-destructive display); module-scoped claim instead of a component ref so remounts during an in-flight PUT cannot duplicate the migration; failed migration does not auto-retry (reload retries).
</verification>

<success_criteria>
- lib/notes.ts is the only place the notes String column is parsed, migrated and serialized; notes-tab.tsx uses it for every read and write.
- Legacy plain text → exactly one "Anotações Antigas" note, one PUT, even in dev Strict Mode.
- Corrupted notes → visible non-destructive notice shown instead of the "Nenhuma anotação ainda" empty state; no "Nova Anotação"/"Criar primeira anotação" control is offered and no write path can replace the stored value (except the explicit dev-only clear button). Same for un-migrated legacy text.
- Valid notes behave exactly as before.
- `bun test`, `npx tsc --noEmit`, `bun run build` pass; prisma/schema.prisma untouched.
</success_criteria>

<output>
Create `.planning/quick/261101-iik-centralize-notes-logic-note-01-create-a-shared-util-e-g-lib/261101-iik-SUMMARY.md` when done (frontmatter `status: complete`).
</output>
