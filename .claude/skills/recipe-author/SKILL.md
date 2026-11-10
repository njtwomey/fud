---

name: recipe-author
description: Turn a pasted recipe, URL, photo or PDF page into a valid recipes/<slug>/recipe.yaml in this project's schema, preparing every ingredient against the taxonomy. Use whenever the user gives a recipe to add or asks to revise one.
---

# Author a recipe

Goal: a `recipes/<slug>/recipe.yaml` that passes `make doctor` with no errors, written faithfully from the source.
Read `docs/schema.md` first if you have not this session. The Zod schemas in `web/src/lib/schema/` are the source of truth.

## Steps

1. **Get the source.** Pasted text is used as is. For a URL use WebFetch. For a photo or PDF page, read it directly.
2. **Pick the slug.** Lowercase kebab-case from the dish name, unique across `recipes/`. The folder name must equal `slug`.
3. **Map every ingredient to the taxonomy.** (When several authors work at once, propose new entries in your own `build/staging/<name>/` folder instead of editing `data/`; see `docs/extending.md`.) Search `data/ingredients.yaml` by `id`, `name` and `aliases`.
   - Found: use the id.
   - Not found: do not invent an id inside the recipe. Add a taxonomy entry first: choose a `category` from the
     `categories` list in that file, give `each_g`/`each_label` for counted items and `density_g_per_ml` for liquids
     and powders measured by volume, and fill `nutrition` using the `recipe-nutrition` skill. Tell the user which
     entries you added.
   - Prefer an existing close entry to near-duplicates ("cashews" vs "cashew nuts").
4. **Units.** Allowed: `g`, `kg`, `ml`, `l`, `each`, and `tsp` / `tbsp` for herbs and spices only (ingredients in a
   category with `spoon_measures: true`; they need `density_g_per_ml`). Everything else is metric: tbsp = 15 ml,
   cup = 240 ml, oz = 28 g, lb = 454 g, pint = 568 ml. Counted things use `each` and need `each_g` on the
   ingredient. No quantity at all ("to coat", "to taste", "a bit of curry powder") means omit `quantity`.
   Ingredient lines say what the ingredient is, never how it is prepared: put "finely diced" in the method. If the
   form is the ingredient (minced beef, tinned tomatoes) it is its own taxonomy entry. There is no `prep` field.
5. **Group into components (phases).** One component per ingredient group in the source (sauce, base, to finish).
   Ingredients are listed in order of use. Give every line a unique kebab-case `id`.
6. **Write the steps as stages, not micro-actions.** Aim for roughly 6 to 10 steps. Each step is a meaningful stage
   with a short imperative `title` ("Roast the vegetables"), a `text` of a sentence or two saying what and why,
   and `substeps` for the detailed actions inside it. Merge adjacent small actions that belong together (chop
   and heat the oven; toast and crush). Each step belongs to one component.
   - `kind`: `prep` (mise en place), `cook` (hands-on heat or assembly), `wait` (passive rest, marinate, chill), `serve`.
   - Always refer to ingredients with tokens, never by hardcoded name, so quantities scale and swaps flow through:
     `{line-id}` gives quantity and name, `{line-id:name}` just the name.
   - **Name every ingredient; never use a collective.** Do not write "all the spices", "season everything", "and all
     seasonings", "the remaining ingredients", "etc." or "and so on": list them with tokens in `text` and `substeps`
     ("Mix {flour}, {salt}, {bran} and {bicarb}"), and in plain words in cues, notes, titles and line notes, where
     tokens are not rendered. Reword spatial uses ("browned evenly on every side", "right through"). `make doctor`
     rejects _all_, _everything_, _seasoning(s)_, _etc._, _and so on_ and _the remaining ingredients_ unless a
     parenthesis after them names what they cover.
   - Name component titles as plain nouns ("Peanut sauce", "Rice"), not "For the pot".
   - Timings: `active_min` (attention) and `passive_min` (hands-off). Pair every timing with a `cue` (what to see,
     smell or hear). If the source gives none, write a reasonable one and note it in `open_questions`.
   - `after`: list prerequisite step ids. Omit it to follow the previous step in the component; use `[]` to start
     at zero in parallel. This is what drives the timeline, so model real parallelism (chopping while the oven heats).
   - `make_ahead: true` for anything that can be done earlier.
   - `tools`: ids from `data/tools.yaml`, with `alternatives` where another tool genuinely works. Add missing tools
     to `data/tools.yaml` with sensible `substitutes`.
   - Oven temperatures: fan first (`temperature: {celsius, mode: fan}`), conventional in the text in brackets.
7. **Self-contained and private.** Inline anything the recipe needs from another recipe (its ingredients and steps)
   rather than saying "see the slaw recipe". Never mention where the recipe came from (a book, an import, a chat
   project); only a real web address belongs in `source: {kind: web, url}`. Alternatives are just alternatives
   ("Rump steak works instead"), not "the other version says". `make doctor` rejects both.
8. **Metadata.** `servings` (the number the quantities are written for; if unknown, assume and add to
   `open_questions`), `tags` (ids from `data/tags.yaml`; add genuinely useful ones, not SEO junk), `source`
   (kind from `data/recipe-options.yaml`, plus url/title), `version: 1`, today's `date`, `status: draft`.
9. **Swaps.** Put recipe-specific substitutions on the ingredient line. General ones belong in `data/swaps.yaml`.
10. **Notes and open questions.** Make-ahead, storage and optional ideas go in `notes`. Anything you assumed or
    the source left out goes in `open_questions`. Never invent detail silently.
11. **Photos.** Copy images into `recipes/<slug>/images/` and list them under `images` (first is the hero) with
    meaningful `alt`. Step photos go on the step's `photos`.
12. **Check.** Run `make format`, then `make doctor`, fix every error, and read the warnings. Then `make data`.

## Conventions carried over from the user's recipe project

- UK ingredient names and spelling.
- Metric weights primary.
- Versioning: a revised recipe keeps its slug, increments `version` and updates `date`. When the user declares a
  version settled set `status: canonical` and leave it alone; experiments branch into a new slug such as
  `chicken-karahi-v4a`.
- Do not introduce ingredients or techniques the user did not mention; put suggestions under `notes`, flagged optional.
- Ask the user once, as a consolidated list, only for things that are impossible to assume.

Everything in a vocabulary (categories, tag domains, tool categories, swap qualities, statuses, source kinds) lives
in `data/`. Add to those files rather than touching code.
