import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import type { Additions, FileFacts, Issue } from '../../web/src/lib/recipe'
import {
  type Catalog,
  Ingredient,
  IngredientsFile,
  Kitchen,
  Recipe,
  RecipeOptionsFile,
  SwapRule,
  SwapsFile,
  Tag,
  TagsFile,
  Tool,
  ToolsFile,
  z,
} from '../../web/src/lib/schema'

export const ROOT = path.resolve(import.meta.dirname, '..', '..')
export const DATA_DIR = path.join(ROOT, 'data')
export const RECIPES_DIR = path.join(ROOT, 'recipes')
export const WEB_DATA_DIR = path.join(ROOT, 'web', 'public', 'data')
export const BUILD_DIR = path.join(ROOT, 'build')
export const STAGING_DIR = path.join(BUILD_DIR, 'staging')

/** Optional files an author may drop in a staging folder: proposed taxonomy entries, without the vocabularies. */
export const StagingFiles = {
  'ingredients.yaml': z.object({ ingredients: z.array(Ingredient) }).strict(),
  'tools.yaml': z.object({ tools: z.array(Tool) }).strict(),
  'tags.yaml': z.object({ tags: z.array(Tag) }).strict(),
  'swaps.yaml': z.object({ swaps: z.array(SwapRule) }).strict(),
} as const

const IMAGE_SUFFIX = /\.(jpe?g|png|webp|avif)$/i

function readYaml<S extends z.ZodType>(
  file: string,
  schema: S,
  where: string,
  issues: Issue[],
): z.output<S> | undefined {
  if (!existsSync(file)) {
    issues.push({ severity: 'error', where, message: 'file is missing' })
    return undefined
  }
  let raw: unknown
  try {
    raw = parseYaml(readFileSync(file, 'utf8'))
  } catch (e) {
    issues.push({ severity: 'error', where, message: `invalid YAML: ${e instanceof Error ? e.message : String(e)}` })
    return undefined
  }
  const result = schema.safeParse(raw)
  if (result.success) return result.data
  for (const issue of result.error.issues) {
    const loc = issue.path.join('.')
    issues.push({ severity: 'error', where: loc ? `${where}:${loc}` : where, message: issue.message })
  }
  return undefined
}

export interface LoadedLibrary {
  catalog: Catalog
  facts: FileFacts
  /** Absolute folder of each recipe, by slug. */
  folders: Record<string, string>
  /** Problems found while reading and schema-validating files. Cross-reference checks are separate. */
  issues: Issue[]
}

const dataFile = (name: string) => path.join(DATA_DIR, name)

/** Staging folders under build/staging, one per author, in name order. */
export function listStagingDirs(): string[] {
  if (!existsSync(STAGING_DIR)) return []
  return readdirSync(STAGING_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => path.join(STAGING_DIR, e.name))
    .sort()
}

/** Read the proposed taxonomy entries in one staging folder. Missing files are fine. */
export function readStaging(dir: string, issues: Issue[]): Additions {
  const label = path.relative(ROOT, dir)
  const out: Additions = {}
  const ingredients = existsSync(path.join(dir, 'ingredients.yaml'))
    ? readYaml(
        path.join(dir, 'ingredients.yaml'),
        StagingFiles['ingredients.yaml'],
        `${label}/ingredients.yaml`,
        issues,
      )
    : undefined
  const tools = existsSync(path.join(dir, 'tools.yaml'))
    ? readYaml(path.join(dir, 'tools.yaml'), StagingFiles['tools.yaml'], `${label}/tools.yaml`, issues)
    : undefined
  const tags = existsSync(path.join(dir, 'tags.yaml'))
    ? readYaml(path.join(dir, 'tags.yaml'), StagingFiles['tags.yaml'], `${label}/tags.yaml`, issues)
    : undefined
  const swaps = existsSync(path.join(dir, 'swaps.yaml'))
    ? readYaml(path.join(dir, 'swaps.yaml'), StagingFiles['swaps.yaml'], `${label}/swaps.yaml`, issues)
    : undefined
  if (ingredients) out.ingredients = ingredients.ingredients
  if (tools) out.tools = tools.tools
  if (tags) out.tags = tags.tags
  if (swaps) out.swaps = swaps.swaps
  return out
}

/**
 * Read the taxonomy and every recipe, reporting all schema problems instead of stopping at the first.
 * Entries from `staging` folders are added on top of the data files (duplicates are left for doctor to report).
 */
export function loadLibrary(opts: { staging?: readonly string[] } = {}): LoadedLibrary {
  const issues: Issue[] = []
  const ingredients = readYaml(dataFile('ingredients.yaml'), IngredientsFile, 'ingredients.yaml', issues)
  const tools = readYaml(dataFile('tools.yaml'), ToolsFile, 'tools.yaml', issues)
  const tags = readYaml(dataFile('tags.yaml'), TagsFile, 'tags.yaml', issues)
  const swaps = readYaml(dataFile('swaps.yaml'), SwapsFile, 'swaps.yaml', issues)
  const options = readYaml(dataFile('recipe-options.yaml'), RecipeOptionsFile, 'recipe-options.yaml', issues)
  const kitchen = readYaml(dataFile('kitchen.yaml'), Kitchen, 'kitchen.yaml', issues)

  const recipes: Recipe[] = []
  const facts: FileFacts = { folderBySlug: {}, imagesBySlug: {} }
  const folders: Record<string, string> = {}
  if (existsSync(RECIPES_DIR)) {
    for (const entry of readdirSync(RECIPES_DIR, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const folder = path.join(RECIPES_DIR, entry.name)
      const recipe = readYaml(path.join(folder, 'recipe.yaml'), Recipe, `${entry.name}/recipe.yaml`, issues)
      if (!recipe) continue
      recipes.push(recipe)
      folders[recipe.slug] = folder
      facts.folderBySlug[recipe.slug] = entry.name
      const imagesDir = path.join(folder, 'images')
      facts.imagesBySlug[recipe.slug] = existsSync(imagesDir)
        ? readdirSync(imagesDir).filter((f) => IMAGE_SUFFIX.test(f))
        : []
    }
  }
  const catalog: Catalog = {
    categories: ingredients?.categories ?? [],
    tool_categories: tools?.categories ?? [],
    tag_domains: tags?.domains ?? [],
    swap_qualities: swaps?.qualities ?? [],
    recipe_statuses: options?.statuses ?? [],
    source_kinds: options?.source_kinds ?? [],
    ingredients: ingredients?.ingredients ?? [],
    tools: tools?.tools ?? [],
    tags: tags?.tags ?? [],
    swaps: swaps?.swaps ?? [],
    kitchen: kitchen ?? Kitchen.parse({}),
    recipes: recipes.sort((a, b) => a.title.localeCompare(b.title)),
  }
  for (const dir of opts.staging ?? []) {
    const add = readStaging(dir, issues)
    catalog.ingredients.push(...(add.ingredients ?? []))
    catalog.tools.push(...(add.tools ?? []))
    catalog.tags.push(...(add.tags ?? []))
    catalog.swaps.push(...(add.swaps ?? []))
  }
  return { catalog, facts, folders, issues }
}
