/**
 * Validate the whole library: YAML against the schema, then cross references (ingredients, tools, tags, steps,
 * images, dependencies) and nutrition coverage. Exits 1 on any error, or on warnings with --strict.
 *
 *   tsx scripts/doctor.ts [--strict] [--recipe <slug>] [--staging <dir>]... [--staging-all]
 *
 * --recipe limits recipe findings to one slug (taxonomy findings are always shown). --staging adds proposed taxonomy
 * entries from a folder, or --staging-all from every folder under build/staging.
 */
import { parseArgs } from 'node:util'
import { validateLibrary } from '../web/src/lib/recipe'
import { listStagingDirs, loadLibrary } from './lib/load'

const { values } = parseArgs({
  options: {
    strict: { type: 'boolean', default: false },
    recipe: { type: 'string' },
    quiet: { type: 'boolean', default: false },
    staging: { type: 'string', multiple: true },
    'staging-all': { type: 'boolean', default: false },
  },
})

const staging = [...(values.staging ?? []), ...(values['staging-all'] ? listStagingDirs() : [])]
const { catalog, facts, issues: loadIssues } = loadLibrary({ staging })
const issues = [...loadIssues, ...validateLibrary(catalog, facts)].filter(
  (i) =>
    !values.recipe || i.where.startsWith(values.recipe) || !catalog.recipes.some((r) => i.where.startsWith(r.slug)),
)
const errors = issues.filter((i) => i.severity === 'error')
const warnings = issues.filter((i) => i.severity === 'warning')

for (const issue of issues) {
  if (issue.severity === 'warning' && values.quiet) continue
  console.log(`${issue.severity.toUpperCase().padEnd(7)} ${issue.where}: ${issue.message}`)
}
console.log(
  `\n${catalog.recipes.length} recipes, ${catalog.ingredients.length} ingredients, ${catalog.tools.length} tools: ` +
    `${errors.length} errors, ${warnings.length} warnings`,
)
process.exit(errors.length > 0 || (values.strict && warnings.length > 0) ? 1 : 0)
