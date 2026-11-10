/**
 * Export JSON Schema for every YAML file kind, so editors can validate and autocomplete while you write recipes.
 * The Zod schemas in web/src/lib/schema are the source of truth; the output in schemas/ is committed.
 *
 *   tsx scripts/export-schemas.ts [--check]
 *
 * --check writes nothing and exits 1 if the committed schemas differ from the Zod source.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import {
  IngredientsFile,
  Kitchen,
  Recipe,
  RecipeOptionsFile,
  SwapsFile,
  TagsFile,
  ToolsFile,
  z,
} from '../web/src/lib/schema'
import { ROOT } from './lib/load'

const { values } = parseArgs({ options: { check: { type: 'boolean', default: false } } })

const targets = {
  'recipe.schema.json': Recipe,
  'ingredients.schema.json': IngredientsFile,
  'tools.schema.json': ToolsFile,
  'recipe-options.schema.json': RecipeOptionsFile,
  'tags.schema.json': TagsFile,
  'swaps.schema.json': SwapsFile,
  'kitchen.schema.json': Kitchen,
} as const

const outDir = path.join(ROOT, 'schemas')
let stale = 0
for (const [file, schema] of Object.entries(targets)) {
  // io: 'input' describes what an author may write, so fields with defaults stay optional.
  const text = `${JSON.stringify(z.toJSONSchema(schema, { io: 'input' }), null, 2)}\n`
  const target = path.join(outDir, file)
  if (values.check) {
    if (!existsSync(target) || readFileSync(target, 'utf8') !== text) {
      console.error(`stale: schemas/${file}`)
      stale++
    }
  } else {
    mkdirSync(outDir, { recursive: true })
    writeFileSync(target, text)
  }
}
if (values.check && stale > 0) {
  console.error("Run 'make schemas' and commit the result.")
  process.exit(1)
}
if (!values.check) console.log(`Wrote ${Object.keys(targets).length} schemas to schemas/`)
