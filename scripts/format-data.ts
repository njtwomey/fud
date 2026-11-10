/**
 * Rewrite every YAML data file in one consistent style: block collections only (no inline `{ a: b }` or `[a, b]`),
 * a blank line between entries of top-level lists, comments preserved. Keeps hand edits and the authoring skill
 * writing the same shape.
 *
 *   tsx scripts/format-data.ts [--check] [file...]
 *
 * With file arguments only those files are formatted, which is what to use when several people are writing at once.
 *
 * --check writes nothing and exits 1 if any file would change.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { isMap, parseDocument, visit } from 'yaml'
import { DATA_DIR, RECIPES_DIR } from './lib/load'

const { values, positionals } = parseArgs({
  options: { check: { type: 'boolean', default: false } },
  allowPositionals: true,
})

export function formatYaml(text: string): string {
  const doc = parseDocument(text)
  visit(doc, {
    // An empty collection has no block form: leave `[]` and `{}` as they are.
    Map(_key, node) {
      if (node.items.length > 0) node.flow = false
    },
    Seq(_key, node, ancestors) {
      if (node.items.length > 0) node.flow = false
      // ancestors: document, root map, pair. A depth-2 list is a top-level collection such as `tools:` or `steps:`.
      if (ancestors.length === 3) {
        node.items.forEach((item, i) => {
          if (i > 0 && isMap(item)) item.spaceBefore = true
        })
      }
    },
  })
  return doc.toString({ lineWidth: 0 })
}

function targets(): string[] {
  const files = existsSync(DATA_DIR)
    ? readdirSync(DATA_DIR)
        .filter((f) => f.endsWith('.yaml'))
        .map((f) => path.join(DATA_DIR, f))
    : []
  if (existsSync(RECIPES_DIR)) {
    for (const entry of readdirSync(RECIPES_DIR, { withFileTypes: true })) {
      const file = path.join(RECIPES_DIR, entry.name, 'recipe.yaml')
      if (entry.isDirectory() && existsSync(file)) files.push(file)
    }
  }
  return files
}

let changed = 0
for (const file of positionals.length > 0 ? positionals.map((f) => path.resolve(f)) : targets()) {
  const before = readFileSync(file, 'utf8')
  const after = formatYaml(before)
  if (before === after) continue
  changed++
  if (values.check) console.error(`needs formatting: ${path.relative(process.cwd(), file)}`)
  else writeFileSync(file, after)
}
if (values.check && changed > 0) {
  console.error("Run 'make format' to fix.")
  process.exit(1)
}
if (!values.check) console.log(changed === 0 ? 'Data files already formatted' : `Formatted ${changed} data files`)
