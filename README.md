# Fud

A personal recipe library as a static site. Recipes are YAML files; the site shows ingredients beside the method
(scaled to servings), a timeline of what to do when, equipment with substitutes, swaps, nutrition estimates and a
combined shopping list.

```
make setup     # install
make dev       # build the data and start the dev server on a free port
make check     # lint, types, tests, schema and recipe validation
make build     # validate and produce the static site in web/dist
```

Add recipes by asking Claude Code with the `recipe-author` skill (paste a recipe, URL or photo). See `CLAUDE.md`
for how the project is organised and `docs/` for the schema and extension notes.
