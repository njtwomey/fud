/**
 * Read a Mealie backup into one plain dossier per recipe, as raw material for the recipe-import-mealie skill.
 * Mealie mostly stores ingredients as free text, so mapping them onto the taxonomy is judgement work and is not
 * attempted here.
 *
 *   tsx scripts/import-mealie.ts --backup assets/mealie_2026.11.10.15.43.36 [--out build/mealie]
 *
 * Writes <out>/<slug>/mealie.json and copies the original image beside it as original.webp.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { BUILD_DIR, ROOT } from './lib/load'

const { values } = parseArgs({
  options: { backup: { type: 'string' }, out: { type: 'string', default: path.join(BUILD_DIR, 'mealie') } },
})
if (!values.backup) {
  console.error('Missing --backup <path to the Mealie backup folder>')
  process.exit(2)
}
const backup = path.resolve(ROOT, values.backup)
const out = path.resolve(ROOT, values.out)

type Row = Record<string, unknown>
const db = JSON.parse(readFileSync(path.join(backup, 'database.json'), 'utf8')) as Record<string, Row[]>
const table = (name: string): Row[] => db[name] ?? []
const nameById = (name: string): Map<unknown, unknown> => new Map(table(name).map((r) => [r.id, r.name]))
const units = nameById('ingredient_units')
const foods = nameById('ingredient_foods')
const tags = nameById('tags')
const categories = nameById('categories')

/** Mealie stores ids as 32 hex characters in the database but as hyphenated UUIDs on disk. */
function hyphenate(id: string): string {
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
}

let count = 0
for (const r of table('recipes')) {
  const id = String(r.id)
  const slug = String(r.slug)
  const byPosition = (a: Row, b: Row) => Number(a.position) - Number(b.position)
  const nutrition = table('recipe_nutrition').find((n) => n.recipe_id === id) ?? {}
  const dossier = {
    slug,
    name: r.name,
    description: r.description,
    yield: r.recipe_yield,
    times: { prep: r.prep_time, perform: r.perform_time, cook: r.cook_time, total: r.total_time },
    source_url: r.org_url,
    rating: r.rating,
    tags: table('recipes_to_tags')
      .filter((t) => t.recipe_id === id)
      .map((t) => tags.get(t.tag_id)),
    categories: table('recipes_to_categories')
      .filter((c) => c.recipe_id === id)
      .map((c) => categories.get(c.category_id)),
    ingredients: table('recipes_ingredients')
      .filter((i) => i.recipe_id === id)
      .sort(byPosition)
      .map((i) => ({
        text: i.original_text ?? i.note,
        quantity: i.quantity,
        unit: units.get(i.unit_id) ?? null,
        food: foods.get(i.food_id) ?? null,
        section: i.title ?? null,
      })),
    instructions: table('recipe_instructions')
      .filter((s) => s.recipe_id === id)
      .sort(byPosition)
      .map((s) => ({ section: s.title || null, text: s.text })),
    nutrition: Object.fromEntries(
      Object.entries(nutrition).filter(([k]) => k === 'calories' || k.endsWith('_content')),
    ),
    image_file: null as string | null,
  }
  const folder = path.join(out, slug)
  mkdirSync(folder, { recursive: true })
  const image = path.join(backup, 'data', 'recipes', hyphenate(id), 'images', 'original.webp')
  if (existsSync(image)) {
    copyFileSync(image, path.join(folder, 'original.webp'))
    dossier.image_file = 'original.webp'
  }
  writeFileSync(path.join(folder, 'mealie.json'), JSON.stringify(dossier, null, 2))
  count++
}
console.log(`Wrote ${count} recipe dossiers to ${path.relative(process.cwd(), out)}`)
