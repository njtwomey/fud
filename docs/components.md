# Components

Domain components in `web/src/lib/components/` (page-agnostic, tested in `components.test.tsx`).
Primitives from shadcn live in `web/src/lib/ui/` and are not listed.

| Component            | Purpose                                                                                                                                                                | Key props                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `ServingsStepper`    | Plus/minus servings control                                                                                                                                            | `value`, `onChange`, `min`, `max`, `label`                                                 |
| `KindBadge`          | Coloured prep/cook/wait/serve label                                                                                                                                    | `kind`                                                                                     |
| `StepText`           | Step text with `{line-id}` tokens as scaled quantities                                                                                                                 | `text`, `lines`, `ingredients`, `factor`                                                   |
| `IngredientPanel`    | Ingredients by phase, scaled, tickable; swap menu per line that rewrites the recipe; highlights                                                                        | `recipe`, `factor`, `ingredients`, `swaps`, `qualities`, `chosen`, `onSwap`, `highlighted` |
| `StepCard`           | One method stage: headline, description, substeps, cue, photos; time and temperature beside the headline; kind-coloured number ticks it off; the whole card selects it | `step`, `number`, `lines`, `ingredients`, `factor`, `done`, `active`, `onSelect`           |
| `Timeline`           | Gantt-style schedule (rows are step titles) with slack and optional clock times                                                                                        | `recipe`, `schedule`, `serveAt`                                                            |
| `NutritionTable`     | Per-serving estimate with coverage note                                                                                                                                | `estimate`, `names`                                                                        |
| `ToolList`           | Equipment with have/missing, owned substitutes, and highlight for the selected step                                                                                    | `toolIds`, `tools`, `owned`, `highlighted`                                                 |
| `RecipeCard`         | Library grid card                                                                                                                                                      | `to`, `title`, `summary`, `imageSrc`, `totalMin`, `servings`, `tags`                       |
| `TagFilter`          | Tags grouped by data-defined domain                                                                                                                                    | `domains`, `tags`, `selected`, `onToggle`                                                  |
| `ViewSwitcher`       | Single-choice segmented control                                                                                                                                        | `value`, `onChange`, `options`, `label`                                                    |
| `ShoppingList`       | Items grouped by data-defined category, pluralised, spoon fractions                                                                                                    | `groups`, `ingredients`                                                                    |
| `ZoomableImage`      | Photo thumbnail that opens full size in a modal with its caption (shadcn Dialog)                                                                                       | `src`, `alt`, `caption`, `className`                                                       |
| `CollapsibleSection` | Titled block that folds away; open state remembered in the browser (shadcn Collapsible)                                                                                | `id`, `title`, `defaultOpen`                                                               |
| `CookingModeToggle`  | Keeps the screen awake while cooking (Screen Wake Lock API); hidden where unsupported; off by default                                                                  | none                                                                                       |

Non-visual `lib` modules: `theme` (provider, `useTheme`), `catalog` (loader, provider, `useCatalog`, URL helpers),
`plan` (shopping plan and chosen swaps in localStorage), `hooks/use-local-storage`, and `recipe/*` (units, schedule, nutrition,
views, text, shopping, validate).

Composed patterns in `web/src/ux/`:

| Component                                  | Purpose                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `AppShell`                                 | Nav bar plus full-width content, tooltip provider, catalog gate |
| `NavBar`                                   | Title, section links, theme toggle                              |
| `ThemeToggle`                              | Light / dark / system dropdown                                  |
| `PageHeader`                               | Title, description, actions slot                                |
| `Section`                                  | Titled page block                                               |
| `EmptyState`, `ErrorState`, `LoadingState` | Page-level states                                               |
| `CatalogGate`                              | Loading and error states until the catalog is ready             |
