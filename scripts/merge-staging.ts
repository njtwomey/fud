/**
 * Fold the proposed taxonomy entries in build/staging/* into data/*.yaml. First definition of an id wins; clashes
 * and possible duplicates are printed for a person to resolve. Run `make format` afterwards.
 *
 *   tsx scripts/merge-staging.ts [--dry-run] [--clean]
 *
 * --clean deletes the staging folders after a successful merge.
 */
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { Document, parseDocument } from 'yaml'
import type { Issue } from '../web/src/lib/recipe'
import { mergeAdditions, type Taxonomy } from '../web/src/lib/recipe'
import { DATA_DIR, listStagingDirs, loadLibrary, readStaging } from './lib/load'

const { values } = parseArgs({
  options: { 'dry-run': { type: 'boolean', default: false }, clean: { type: 'boolean', default: false } },
})

const issues: Issue[] = []
const dirs = listStagingDirs()
const additions = dirs.map((d) => readStaging(d, issues))
const { catalog } = loadLibrary()
const base: Taxonomy = {
  ingredients: catalog.ingredients,
  tools: catalog.tools,
  tags: catalog.tags,
  swaps: catalog.swaps,
}
const { merged, notes } = mergeAdditions(base, additions)

for (const i of issues) console.log(`${i.severity.toUpperCase().padEnd(7)} ${i.where}: ${i.message}`)
for (const n of notes) console.log(`NOTE    ${n}`)
if (issues.some((i) => i.severity === 'error')) {
  console.error('Staging files have schema errors; nothing was merged.')
  process.exit(1)
}

const counts = (k: keyof Taxonomy) => merged[k].length - base[k].length
console.log(
  `${dirs.length} staging folders: +${counts('ingredients')} ingredients, +${counts('tools')} tools, +${counts('tags')} tags, swaps now ${merged.swaps.length}`,
)
if (values['dry-run']) process.exit(0)

const write = (file: string, key: keyof Taxonomy) => {
  const target = path.join(DATA_DIR, file)
  const doc = parseDocument(readFileSync(target, 'utf8'))
  doc.set(key, new Document(merged[key]).contents)
  writeFileSync(target, doc.toString({ lineWidth: 0 }))
}
write('ingredients.yaml', 'ingredients')
write('tools.yaml', 'tools')
write('tags.yaml', 'tags')
write('swaps.yaml', 'swaps')
if (values.clean) for (const d of dirs) rmSync(d, { recursive: true, force: true })
