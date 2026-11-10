---

name: recipe-import-mealie
description: Import recipes from a Mealie backup (assets/mealie_*) into this project's schema. Dumps the backup to dossiers, then converts them with the recipe-author skill. Use when the user wants Mealie recipes brought across.
---

# Import from Mealie

Mealie data is mostly free text, so this is a two-stage job: a script flattens the backup, then you convert
each dossier into a proper recipe with judgement.

## Steps

1. **Dump.** `make mealie-dump BACKUP=assets/<mealie backup folder>`. This writes `build/mealie/<slug>/mealie.json`
   plus `original.webp` for each recipe. `build/` is gitignored. Do not edit the backup in `assets/`.
2. **Triage with the user.** List the recipe names and ask which to import (or all). Some entries are clearly
   web clippings with junk (for example a social media post title); flag those.
3. **Convert one recipe at a time using the `recipe-author` skill**, with the dossier as the source:
   - `ingredients[].text` is the real ingredient line. `quantity` and `unit` are often defaults (quantity 1, no
     unit), so trust the text, not the fields.
   - `instructions[].text` are often long paragraphs with several actions: split into one action per step and
     assign `kind`, timings, cues and `after` dependencies.
   - `yield` becomes `servings` (assume and flag if unclear).
   - `tags` are frequently SEO noise ("Good Food", "Bbc Sauce Recipe"). Map only meaningful ones onto
     `data/tags.yaml`; add a new tag only if it is genuinely useful for browsing.
   - If `source_url` is a real web address, record it as `source: {kind: web, url}`. Otherwise record no source.
     Never mention Mealie, the dump or the backup anywhere in the recipe; `make doctor` rejects it.
   - Nutrition in the dossier is ignored: nutrition comes from the taxonomy.
4. **Image.** Copy `original.webp` to `recipes/<slug>/images/hero.webp`, reference it under `images` with an
   `alt` describing the finished dish.
5. **Check each recipe** with `make format` and `make doctor` before moving to the next, and keep taxonomy
   additions consistent across recipes (the same ingredient must not get two ids).
6. Finish with `make data` and summarise: imported, skipped, assumptions made, new taxonomy entries.

Credentials: the live Mealie server needs an API token. Do not ask for or store one unless the user offers; the
backup dump is the supported path.
