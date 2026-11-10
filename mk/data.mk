data: ## Validate recipes and build the catalog the site loads
	pnpm exec tsx scripts/build-data.ts

doctor: ## Validate the taxonomy and every recipe (add STRICT=1 to fail on warnings)
	pnpm exec tsx scripts/doctor.ts $(if $(STRICT),--strict,)

schemas: ## Regenerate the JSON Schemas used for editor validation of YAML files
	pnpm exec tsx scripts/export-schemas.ts

schemas-check: ## Fail if the committed JSON Schemas are out of date
	pnpm exec tsx scripts/export-schemas.ts --check

mealie-dump: ## Convert a Mealie backup into dossiers in build/mealie (BACKUP=assets/mealie_...)
	pnpm exec tsx scripts/import-mealie.ts --backup $(BACKUP)

format-data: ## Rewrite data YAML in the standard block style
	pnpm exec tsx scripts/format-data.ts

format-data-check: ## Fail if any data YAML is not in the standard block style
	pnpm exec tsx scripts/format-data.ts --check

merge-staging: ## Fold proposed taxonomy entries from build/staging into data/ (add DRY=1 to preview)
	pnpm exec tsx scripts/merge-staging.ts $(if $(DRY),--dry-run,)
