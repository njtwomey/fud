# Recipe library. All routine work goes through these targets.
# Fragments in mk/ hold the targets; add new ones there instead of editing this file.

.DEFAULT_GOAL := help
.PHONY: help setup dev build lint format typecheck test check schemas schemas-check doctor data clean

include mk/web.mk
include mk/data.mk

help: ## List the available targets
	@grep -hE '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

setup: ## Install all dependencies
	pnpm install

check: lint typecheck test schemas-check doctor ## Everything that must pass before a commit

clean: ## Remove build output and caches
	rm -rf web/dist web/public/data build web/node_modules/.tmp web/node_modules/.vite
