# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal recipe library published as a static React site. Recipes, ingredients, tools and tags are YAML files
under `data/` and `recipes/`; a TypeScript build step validates them and emits `web/public/data/catalog.json`,
which the React app loads. There is no backend and no authoring UI: recipes are added through the project skills
in `.claude/skills/` (`recipe-author`, `recipe-nutrition`, `recipe-import-mealie`, `recipe-doctor`).

TypeScript only. The Zod schemas in `web/src/lib/schema/` are the single source of truth for the file formats and
the types; there is no code generation and no second language.

```
data/                 vocabularies and taxonomy (YAML): ingredients (+categories), tools (+categories),
                      tags (+domains), swaps (+qualities), recipe-options (statuses, source kinds), kitchen
recipes/<slug>/       recipe.yaml and images/ (folder name == slug)
schemas/              generated JSON Schema so editors can validate YAML (make schemas)
scripts/              tsx scripts: doctor, build-data, format-data, export-schemas, import-mealie
web/src/lib/          schema/, recipe/ (pure logic), components/ (domain UI), ui/ (shadcn), theme, catalog
web/src/ux/           app shell, nav bar, theme toggle, page header, section, empty/error/loading states
web/src/pages/        library, recipe, shopping pages
docs/                 schema.md, components.md, decisions.md, extending.md
assets/               personal source material; gitignored entirely, never committed
```

## Commands

All routine work goes through `make`. Run `make check` before declaring a task finished. Do not call `biome`,
`tsc`, `vitest`, `tsx` or `pnpm` scripts directly when a target exists.

- `make setup` install dependencies. `make dev` builds the data then starts Vite on a random free port
  (set `WEB_PORT` in `.env` to pin one). Re-run `make data` after editing recipes; refresh the browser.
- `make check` = `lint` (Biome + data style check) + `typecheck` + `test` + `schemas-check` + `doctor`.
- `make format` fixes Biome issues and rewrites data YAML to the standard block style.
- `make doctor [STRICT=1]` validates every data file and recipe. `make build` runs it, then produces `web/dist`.
- `make schemas` regenerates `schemas/*.json` after changing a Zod schema; commit the result.
- `make mealie-dump BACKUP=assets/<folder>` flattens a Mealie backup into `build/mealie/` for the import skill.
- `make merge-staging [DRY=1]` folds proposed taxonomy entries from `build/staging/<name>/*.yaml` into `data/`
  (see "Bulk import" in `docs/extending.md`). `scripts/doctor.ts --staging-all --recipe <slug>` checks one recipe
  against the main data plus all staging folders.
- One test file: `pnpm --dir web exec vitest run src/lib/recipe/schedule.test.ts` (the one place a direct call is fine).

## Architecture

**Schema and derived data.** Recipes are components (phases such as "sauce") holding ingredient lines, plus a flat
list of steps. Each step has a `kind` (prep, cook, wait, serve), a component, durations, and optional `after`
dependencies. Every view is derived from that, nothing is stored twice: method "as written" / "prep first" /
"by phase" (`lib/recipe/views.ts`), the timeline (`lib/recipe/schedule.ts`, earliest and latest start with slack),
scaling (`lib/recipe/units.ts`), nutrition (`lib/recipe/nutrition.ts`, computed from per-100 g taxonomy data),
and the shopping list (`lib/recipe/shopping.ts`). Step text uses `{line-id}` tokens so quantities scale.
See `docs/schema.md`.

**One validation pipeline, shared by browser and scripts.** `scripts/lib/load.ts` reads YAML and runs the Zod
file schemas; `lib/recipe/validate.ts` (pure, no filesystem) does the cross-reference checks and is used by
`doctor`, `build-data` and the tests. The browser re-validates `catalog.json` with the same schema at load time.

**Vocabularies live in data, not code.** Every organisational list (ingredient categories and their shop order,
tag domains, tool categories, swap qualities, recipe statuses, source kinds) is a YAML list in `data/` with ids
and labels, referenced by id and validated by doctor. UI labels and ordering come from the catalog. Do not add
a hardcoded enum or label map for such a list. Only things the logic is built on stay in code: units
(`g kg ml l each`), step kinds, heat levels, oven modes.

**Metric, with spoons for spices.** Units are `g`, `kg`, `ml`, `l`, `each` (a count, which needs `each_g` on the
ingredient), and `tsp` / `tbsp` only for ingredients whose category sets `spoon_measures: true` in
`data/ingredients.yaml` (herbs and spices; they need `density_g_per_ml` for nutrition). No cups, ounces or pounds.

**Ingredient lines say what the ingredient is, not how it is prepared.** There is no `prep` field; cutting,
dicing and so on belong in the method. If the form is part of the ingredient (minced beef, tinned tomatoes) it is its
own taxonomy entry.

**Recipes are complete and private.** A recipe never sends the reader to another recipe ("see the slaw recipe"):
anything it needs is inlined, with its own ingredients and steps, even if that duplicates another recipe. And it never
says where it came from (a cookbook, an import, a project); only a real web address may appear, as
`source: {kind: web, url}`. `make doctor` enforces both.

**Recipes name everything.** Wording must never hide which ingredients are meant: no "all the spices", "season
everything", "and all seasonings", "the remaining ingredients", "etc." or "and so on". Name each ingredient, using the
step tokens (`{line-id}`, which also shows the amount) in step text and substeps, and plain words elsewhere (tokens are
not rendered in cues, notes, titles or line notes). The collective words are a `make doctor` error unless a
parenthesis after them lists what they cover. Spatial uses are reworded ("browned evenly on every side", "right
through"). This is so no ingredient is ever missed.

**Steps are stages, not micro-actions.** Each step has a short `title` (headline), a `text` description and optional
`substeps`, aiming for roughly 6 to 10 steps per recipe. Ingredients in step text are always tokens, `{line-id}` for
quantity and name or `{line-id:name}` for just the name, never hardcoded words, so swaps flow through.

**Swaps rewrite the recipe.** Choosing a swap (`lib/recipe/swaps.ts`, `applySwaps`) replaces the line's ingredient and
scales its amount; step text, nutrition, the shopping list and the plan all derive from the swapped recipe. The chosen
swaps are kept with the shopping plan in localStorage.

**Ingredients are vetted.** A recipe can only reference ingredient, tool and tag ids that exist in `data/`.
Add a taxonomy entry first; never loosen a check to make a recipe pass.

**Scheduling assumes unlimited hands.** Steps without a dependency run in parallel even if both need attention,
so total time can be optimistic for one cook (hands-on minutes can exceed elapsed minutes).

## Conventions

- pnpm only. Biome for lint and format, 120 columns, single quotes, no semicolons. Vitest and Testing Library.
- One `.env` at the repo root, read by Vite through `envDir`. Only `VITE_` keys reach the browser.
- Data YAML is block style only (no inline `{ a: b }` or `[a, b]`); `make format` enforces it, including for
  anything the authoring skill writes. Quote values containing `:` or starting with `{`.
- UI primitives come exclusively from shadcn/ui (Radix, "vega" style) in `web/src/lib/ui/`, icons only from
  `lucide-react` imported by name, styling only with Tailwind v4 and the CSS-variable tokens in `web/src/index.css`.
  Add primitives with `pnpm dlx shadcn@latest add <name>` (aliases in `web/components.json` point at `src/lib/ui`).
  The generated files are excluded from Biome; do not hand-edit them. The `shadcn init` command is interactive
  and flaky, so do not re-run it. Step-kind colours are the `--kind-*` tokens.
- The site is hash-routed and the base path is `VITE_BASE`, so it works on GitHub Pages under a project path.

### Layering (enforced by Biome)

Dependencies point downward only: `lib` < `ux` < `pages` < `main.tsx`. `lib` must not import `ux` or `pages`;
`ux` must not import `pages`. `lib` holds reusable, page-agnostic code and carries the real tests: every component
has a render test plus tests of each behaviour, and logic is tested directly. Pages contain no new primitives.

### Duplication rule

Before adding a component, search `lib/` and `ux/`. Extend a similar one rather than adding another; extract
markup that appears twice. Update `docs/components.md` whenever a component is added or changed.

### Page and fold conventions

A page declares its sections in the order a reader meets them: what is visible first, then what progressively
follows (the recipe page: title and key facts, ingredients beside the method, then equipment, nutrition, notes).
Desktop layouts use the full width (`max-w-[1800px]`), with the ingredient panel sticky beside the method.

<!-- Add project-specific page and fold rules below this line. -->

## How to extend

- **New ingredient, tool, tag or category:** add to the matching file in `data/`, then `make format && make doctor`.
- **New vocabulary-backed field:** add the list to the file's schema in `web/src/lib/schema/taxonomy.ts`, the
  field to `catalog.ts` and `scripts/lib/load.ts`, reference checks to `lib/recipe/validate.ts`, then `make schemas`.
- **New component:** `web/src/lib/components/` (domain UI) or `web/src/ux/` (composed patterns) plus a test and an
  entry in `docs/components.md`. **New page:** `web/src/pages/` and a route in `web/src/main.tsx`.
- **New script:** `scripts/`, with a docstring and a `mk/*.mk` target. New make targets go in `mk/`, not the root Makefile.
- **Deploying to GitHub Pages, CI, or other extras:** see `docs/extending.md`.
