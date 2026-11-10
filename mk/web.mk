dev: data ## Build the data, then start the dev server (re-run `make data` after editing recipes)
	pnpm --dir web dev

build: data ## Validate recipes and produce the static site in web/dist
	pnpm --dir web build

lint: format-data-check ## Lint and format-check everything (Biome for code, block style for data)
	pnpm exec biome check .

format: format-data ## Format and apply safe lint fixes
	pnpm exec biome check --write .

typecheck: ## Type-check the web app and the scripts
	pnpm --dir web exec tsc -b
	pnpm --dir web exec tsc -p ../scripts

test: ## Run the Vitest suite
	pnpm --dir web test
