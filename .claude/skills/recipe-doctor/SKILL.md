---

name: recipe-doctor
description: Run and interpret make doctor, then fix schema and cross-reference problems in recipes and the data vocabularies. Use when doctor, build or make check reports errors or warnings, or before declaring recipe work finished.
---

# Fix doctor findings

Run `make doctor` (add `STRICT=1` to treat warnings as failures). Output is one line per problem:
`ERROR|WARNING <where>: <message>`, where `<where>` is a data file, `<slug>`, or `<slug>:<step-or-line-id>`.

## Common errors and the fix

| Message                                                                                | Fix                                                                                                                                                                                             |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `unknown ingredient 'x'`                                                               | Use an existing id from `data/ingredients.yaml`, or add a vetted entry (see `recipe-author` step 3). Never loosen the check.                                                                    |
| `unknown category/domain/status/source kind/swap quality`                              | The value is not in its list in `data/`. Fix the typo, or add the entry to the list if it is a real new category.                                                                               |
| `unknown tool 'x'`                                                                     | Use an id from `data/tools.yaml` or add the tool there with `substitutes`.                                                                                                                      |
| `'x' is in category 'y', which does not allow tsp or tbsp`                             | Convert to g or ml, or (for a genuine herb or spice) move it to a category with `spoon_measures: true`.                                                                                         |
| `'all' hides which ingredients are meant` (also everything, seasoning, etc, and so on) | Name the ingredients: tokens in step text and substeps, plain words in cues, notes, titles and line notes, or a parenthesis listing them. Reword spatial uses ("browned evenly on every side"). |
| `'x' has no each_g, so unit 'each' is not allowed`                                     | Add `each_g` (and `each_label`) to the ingredient, or give the line a weight.                                                                                                                   |
| `unknown step 'x' in after` / `dependency cycle`                                       | Fix the step ids; `after` must form a DAG.                                                                                                                                                      |
| `unknown ingredient line 'x'`                                                          | A `{token}` or `uses` entry names a line id that does not exist in the recipe.                                                                                                                  |
| `slug does not match folder`                                                           | Rename the folder or the slug so they are identical.                                                                                                                                            |
| `missing image 'x'`                                                                    | Put the file in `recipes/<slug>/images/` or remove the reference.                                                                                                                               |
| Schema errors like `Unrecognized key` or `Invalid input`                               | The path in `<where>` points at the field. Typos in keys are errors on purpose. A value containing `:` or a leading `{` must be quoted.                                                         |

## Warnings worth acting on

- `timed cook step has no sensory cue`: add a `cue`.
- `ingredient line is never used by a step`: reference it with `{id}` in a step or list it in `uses`.
- `no nutrition data` / coverage under 90%: use the `recipe-nutrition` skill.
- `image ... is not referenced`: reference or delete it.

After fixing, run `make format` (block-style YAML) and `make check`. Always report what you changed in the data
vocabularies, since those affect every recipe.
