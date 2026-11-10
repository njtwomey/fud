/**
 * Validate, then write the static catalog and recipe images the web app loads.
 * Output: web/public/data/catalog.json and web/public/data/images/<slug>/<file>.
 *
 *   tsx scripts/build-data.ts
 */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { validateLibrary } from '../web/src/lib/recipe'
import { Catalog } from '../web/src/lib/schema'
import { loadLibrary, WEB_DATA_DIR } from './lib/load'

const { catalog, facts, folders, issues: loadIssues } = loadLibrary()
const errors = [...loadIssues, ...validateLibrary(catalog, facts)].filter((i) => i.severity === 'error')
if (errors.length > 0) {
  for (const e of errors) console.error(`ERROR ${e.where}: ${e.message}`)
  console.error(`\nBuild stopped: ${errors.length} errors. Run 'make doctor' for the full report.`)
  process.exit(1)
}

rmSync(WEB_DATA_DIR, { recursive: true, force: true })
mkdirSync(WEB_DATA_DIR, { recursive: true })
writeFileSync(path.join(WEB_DATA_DIR, 'catalog.json'), JSON.stringify(Catalog.parse(catalog)))
for (const [slug, folder] of Object.entries(folders)) {
  const images = path.join(folder, 'images')
  if (existsSync(images)) cpSync(images, path.join(WEB_DATA_DIR, 'images', slug), { recursive: true })
}
console.log(`Built ${catalog.recipes.length} recipes into ${path.relative(process.cwd(), WEB_DATA_DIR)}`)
