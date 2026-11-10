# Schema

The Zod definitions in `web/src/lib/schema/` are authoritative. This is the short version.

## Files

| File                         | Holds                                                                                           |
| ---------------------------- | ----------------------------------------------------------------------------------------------- |
| `data/ingredients.yaml`      | `categories` (shop aisles in walking order; `spoon_measures` allows tsp/tbsp) and `ingredients` |
| `data/tools.yaml`            | `categories` and `tools` with `substitutes`                                                     |
| `data/tags.yaml`             | `domains` and `tags`                                                                            |
| `data/swaps.yaml`            | `qualities` and general `swaps`                                                                 |
| `data/recipe-options.yaml`   | recipe `statuses` and `source_kinds`                                                            |
| `data/kitchen.yaml`          | oven type, hob, owned tool ids, notes                                                           |
| `recipes/<slug>/recipe.yaml` | one recipe; `images/` beside it                                                                 |

Every list of ids and labels is data. References between files are by id and checked by `make doctor`.

## Recipe

- `slug` equals the folder name. `servings` is the base the quantities are written for.
- `components`: phases with their `ingredients`. Each line has a recipe-unique `id`, an `ingredient` id from the
  taxonomy, an optional `quantity` (omit for "to taste" or an unmeasured spice), a short `note`, `optional`, and
  `swaps`. Lines say what the ingredient is; preparation lives in the method.
- `steps`: flat list of stages (aim for 6 to 10). `title` is the headline, `text` the description, `substeps` the
  detailed actions. `component` links a step to a phase; `kind` is `prep`, `cook`, `wait` or `serve`.
  `text` and `substeps` use tokens: `{line-id}` renders the scaled quantity and name, `{line-id:name}` just the name.
  `active_min` + `passive_min` give the duration; `cue` is the sensory sign of doneness.
  `after` lists prerequisite step ids: omitted = follows the previous step in its component (first step starts at
  0); `[]` = starts at 0 in parallel. `make_ahead` marks steps that can be done earlier. `tools` lists tool ids with
  optional `alternatives`. `photos` are step images.
- `status` and `source.kind` are ids from `recipe-options.yaml`. `version` increments on revision.

## Units

`g`, `kg`, `ml`, `l`, `each`, plus `tsp` and `tbsp` for ingredients in categories with `spoon_measures: true`
(herbs and spices). `each` needs `each_g` on the ingredient. Nutrition is per 100 g on the ingredient; ml, l, tsp
and tbsp convert through `density_g_per_ml` (1 tsp = 5 ml, 1 tbsp = 15 ml). Spoon amounts display in quarters
(¼, ½, 1½) and promote to tbsp from 3 tsp; counts display in halves.

## Swaps

A line's swaps (its own, then the general ones for that ingredient in `swaps.yaml`) can be chosen in the UI. The
choice replaces the ingredient and multiplies the amount by the swap's `ratio`, and everything derived (step text,
nutrition, shopping list) follows.

## Views, all derived

- **As written:** authored order, prep and cooking interleaved.
- **Prep first:** every `prep` step, then the rest.
- **By phase:** grouped by component, matching the ingredient groups.
- **Timeline:** earliest start from `after` dependencies, latest start and slack by a backward pass.
  Assumes unlimited hands, so it is optimistic for a single cook.
