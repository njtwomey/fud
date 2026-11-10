# Extending

## Publish to GitHub Pages (not set up yet)

The site is already Pages-ready: hash routing, and `VITE_BASE` sets the base path. To add the workflow:

1. Create `.github/workflows/pages.yml` that runs on push to `main`: install with the mise action (versions
   come from `mise.toml`), run `make check`, then `make build` with `VITE_BASE=/<repo-name>/` (or `/` for a
   user or custom-domain site), upload `web/dist` with `actions/upload-pages-artifact`, and deploy with
   `actions/deploy-pages`. Workflows call `make` targets only, so CI and local runs cannot drift.
2. Look up current action versions when writing it and pin each third-party action to a commit SHA. Give the
   deploy job `pages: write` and `id-token: write`, and the rest the minimum permissions.
3. In the repository settings choose GitHub Actions as the Pages source.
4. Add `.github/dependabot.yml` for GitHub Actions and npm.
5. Remember a public Pages site publishes every recipe and photo. `assets/` is gitignored and never built, but
   anything under `recipes/` ships.

`web/public/data/` is generated and gitignored: CI builds it with `make data` (part of `make build`).

## Other additions

- **Single-cook scheduling:** `computeSchedule` assumes unlimited hands. A resource-levelled variant would take the
  number of cooks and serialise active steps; the timeline component already renders any `ScheduleEntry[]`.
- **Live Mealie sync:** needs an API token and a server, which the static design avoids. Use `make mealie-dump`.
- **Second app or backend:** introduce a pnpm workspace under `web/apps/` and shared packages only when a second
  consumer exists.

## Bulk import with several authors at once

Several people (or agents) can add recipes in parallel without editing the shared taxonomy files, which would race:

1. Each author writes their recipes under `recipes/<slug>/` (separate folders never conflict) and puts any new
   ingredients, tools, tags or swaps in their own `build/staging/<name>/{ingredients,tools,tags,swaps}.yaml`
   (lists only, no `categories`/`domains`/`qualities`; those vocabularies are defined up front in `data/`).
2. They validate with `pnpm exec tsx scripts/doctor.ts --staging-all --recipe <slug>`, which reads the main data
   plus every staging folder, and format only their own files with `scripts/format-data.ts <files>`. They must not
   run `make format`, which rewrites every data file.
3. When everyone is done, `make merge-staging DRY=1` previews the merge, then `make merge-staging` applies it
   (`--clean` removes the staging folders). The first definition of an id wins; clashes and possible duplicate
   ingredients (same name or alias, different id) are printed for a person to resolve. Then `make format`.

The merge logic is `mergeAdditions` in `web/src/lib/recipe/staging.ts`, with tests.
