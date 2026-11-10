import type { Catalog, Recipe } from '../schema'
import { estimateNutrition } from './nutrition'
import { computeSchedule } from './schedule'
import { textTokens } from './text'

export interface Issue {
  severity: 'error' | 'warning'
  where: string
  message: string
}

/** Facts about files on disk, passed in so this module stays pure and runs anywhere. */
export interface FileFacts {
  /** Folder name for each recipe slug, to check slug and folder agree. */
  folderBySlug: Record<string, string>
  /** Image file names present in each recipe's images/ folder. */
  imagesBySlug: Record<string, string[]>
}

const IMAGE_SUFFIX = /\.(jpe?g|png|webp|avif)$/i

/** Where a recipe came from is private to the cook: it must not appear in the recipe itself. */
const PROVENANCE = /cookbook|mealie|recipe project|recipe-project|\bthe dump\b/i
/** A recipe must be complete on its own: no 'see the other recipe'. */
const CROSS_REFERENCE =
  /\(see |\bsee (?:the |that |our |its )?[\w' -]{0,40}\brecipe\b|\b(?:in|from|per|following|follow|using|according to) (?:the|its|our) [\w' -]{1,40}\brecipe\b/i

/**
 * Words that hide which ingredients are meant ("add all the spices", "season everything"). They are allowed only when
 * a parenthesis after them says what they cover, so no ingredient is missed.
 */
const VAGUE_COLLECTIVE =
  /\b(?:all|everything|seasonings?|etc|and so on)\b|\bthe (?:remaining|rest of the) ingredients\b/gi

/** The vague collectives in `text` that have no parenthetical after them naming what they include. */
export function unexplainedCollectives(text: string): string[] {
  return [...text.matchAll(VAGUE_COLLECTIVE)]
    .filter((m) => !text.slice(m.index + m[0].length).includes('('))
    .map((m) => m[0])
}

/** Every sentence a person reads in a recipe, with a label saying where it is. */
function proseOf(recipe: Recipe): [string, string][] {
  const out: [string, string | undefined][] = [['summary', recipe.summary]]
  recipe.notes.forEach((t, i) => out.push([`notes[${i}]`, t]))
  recipe.open_questions.forEach((t, i) => out.push([`open_questions[${i}]`, t]))
  for (const img of [...recipe.images, ...recipe.steps.flatMap((s) => s.photos)]) {
    out.push([`image ${img.file}`, img.alt], [`image ${img.file}`, img.caption])
  }
  for (const line of recipe.components.flatMap((c) => c.ingredients)) {
    out.push([line.id, line.note], ...line.swaps.map((w): [string, string | undefined] => [line.id, w.note]))
  }
  for (const step of recipe.steps) {
    out.push(
      [`${step.id} title`, step.title],
      [step.id, step.text],
      [step.id, step.cue],
      ...step.substeps.map((t): [string, string] => [step.id, t]),
    )
    for (const tool of step.tools) out.push([step.id, tool.note])
  }
  return out.filter((pair): pair is [string, string] => typeof pair[1] === 'string')
}

function duplicates(ids: string[]): string[] {
  return [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]
}

function checkTaxonomy(lib: Catalog, issues: Issue[]): void {
  const error = (where: string, message: string) => issues.push({ severity: 'error', where, message })
  const warn = (where: string, message: string) => issues.push({ severity: 'warning', where, message })
  for (const [file, ids] of [
    ['ingredients.yaml (categories)', lib.categories.map((c) => c.id)],
    ['ingredients.yaml', lib.ingredients.map((i) => i.id)],
    ['tools.yaml (categories)', lib.tool_categories.map((c) => c.id)],
    ['tools.yaml', lib.tools.map((t) => t.id)],
    ['tags.yaml (domains)', lib.tag_domains.map((d) => d.id)],
    ['tags.yaml', lib.tags.map((t) => t.id)],
    ['swaps.yaml (qualities)', lib.swap_qualities.map((q) => q.id)],
    ['recipe-options.yaml (statuses)', lib.recipe_statuses.map((s) => s.id)],
    ['recipe-options.yaml (source_kinds)', lib.source_kinds.map((s) => s.id)],
  ] as const) {
    for (const dup of duplicates([...ids])) error(file, `duplicate id '${dup}'`)
  }
  const names = lib.ingredients.flatMap((i) => [i.name, ...i.aliases].map((n) => n.toLowerCase()))
  for (const dup of duplicates(names)) error('ingredients.yaml', `name or alias '${dup}' is used more than once`)

  const ids = (list: readonly { id: string }[]) => new Set(list.map((x) => x.id))
  const ingredientIds = ids(lib.ingredients)
  const toolIds = ids(lib.tools)
  const categoryIds = ids(lib.categories)
  const toolCategoryIds = ids(lib.tool_categories)
  const domainIds = ids(lib.tag_domains)
  const qualityIds = ids(lib.swap_qualities)

  for (const tag of lib.tags) {
    if (!domainIds.has(tag.domain)) error(`tags.yaml:${tag.id}`, `unknown domain '${tag.domain}'`)
  }
  for (const tool of lib.tools) {
    const at = `tools.yaml:${tool.id}`
    if (!toolCategoryIds.has(tool.category)) error(at, `unknown category '${tool.category}'`)
    for (const sub of tool.substitutes) if (!toolIds.has(sub)) error(at, `unknown substitute '${sub}'`)
  }
  for (const rule of lib.swaps) {
    if (!ingredientIds.has(rule.ingredient)) error('swaps.yaml', `unknown ingredient '${rule.ingredient}'`)
    for (const alt of rule.alternatives) {
      const at = `swaps.yaml:${rule.ingredient}`
      if (!ingredientIds.has(alt.ingredient)) error(at, `unknown swap '${alt.ingredient}'`)
      if (!qualityIds.has(alt.quality)) error(at, `unknown swap quality '${alt.quality}'`)
    }
  }
  for (const id of lib.kitchen.tools) if (!toolIds.has(id)) error('kitchen.yaml', `unknown tool '${id}'`)
  for (const ing of lib.ingredients) {
    const at = `ingredients.yaml:${ing.id}`
    if (!categoryIds.has(ing.category)) error(at, `unknown category '${ing.category}'`)
    if (ing.each_g !== undefined && !ing.each_label && !ing.plural) warn(at, 'each_g set without each_label or plural')
    if (!ing.nutrition) warn(at, 'no nutrition data')
  }
}

function checkRecipe(recipe: Recipe, lib: Catalog, facts: FileFacts, issues: Issue[]): void {
  const where = recipe.slug
  const error = (at: string, message: string) => issues.push({ severity: 'error', where: at, message })
  const warn = (at: string, message: string) => issues.push({ severity: 'warning', where: at, message })
  const ingredients = new Map(lib.ingredients.map((i) => [i.id, i]))
  const toolIds = new Set(lib.tools.map((t) => t.id))
  const tagIds = new Set(lib.tags.map((t) => t.id))
  const spoonCategories = new Set(lib.categories.filter((c) => c.spoon_measures).map((c) => c.id))
  const statusIds = new Set(lib.recipe_statuses.map((x) => x.id))
  const sourceKindIds = new Set(lib.source_kinds.map((x) => x.id))
  const qualityIds = new Set(lib.swap_qualities.map((x) => x.id))

  const folder = facts.folderBySlug[recipe.slug]
  if (folder !== undefined && folder !== recipe.slug)
    error(where, `slug '${recipe.slug}' does not match folder '${folder}'`)
  for (const tag of recipe.tags) if (!tagIds.has(tag)) error(where, `unknown tag '${tag}'`)
  if (!statusIds.has(recipe.status)) error(where, `unknown status '${recipe.status}'`)
  if (recipe.source && !sourceKindIds.has(recipe.source.kind))
    error(where, `unknown source kind '${recipe.source.kind}'`)

  const lines = new Map(recipe.components.flatMap((c) => c.ingredients).map((l) => [l.id, l]))
  for (const line of lines.values()) {
    const at = `${where}:${line.id}`
    const ing = ingredients.get(line.ingredient)
    if (!ing) {
      error(at, `unknown ingredient '${line.ingredient}'`)
      continue
    }
    if ((line.quantity?.unit === 'tsp' || line.quantity?.unit === 'tbsp') && !spoonCategories.has(ing.category)) {
      error(at, `'${ing.id}' is in category '${ing.category}', which does not allow tsp or tbsp`)
    }
    if (line.quantity?.unit === 'each' && ing.each_g === undefined) {
      error(at, `'${ing.id}' has no each_g, so unit 'each' is not allowed`)
    }
    const volume = ['ml', 'l', 'tsp', 'tbsp'].includes(line.quantity?.unit ?? '')
    if (volume && ing.density_g_per_ml === undefined) {
      warn(at, `'${ing.id}' has no density; nutrition skips this line`)
    }
    for (const swap of line.swaps) {
      if (!ingredients.has(swap.ingredient)) error(at, `unknown swap ingredient '${swap.ingredient}'`)
      if (!qualityIds.has(swap.quality)) error(at, `unknown swap quality '${swap.quality}'`)
    }
  }

  for (const [at, text] of proseOf(recipe)) {
    const origin = text.match(PROVENANCE)
    if (origin) error(`${where}:${at}`, `mentions where the recipe came from ('${origin[0]}'): ${text.slice(0, 80)}`)
    for (const word of unexplainedCollectives(text)) {
      error(
        `${where}:${at}`,
        `'${word}' hides which ingredients are meant: name them, or follow it with a parenthesis listing them: ${text.slice(0, 80)}`,
      )
    }
    if (CROSS_REFERENCE.test(text))
      error(`${where}:${at}`, `refers to another recipe; a recipe must be complete on its own: ${text.slice(0, 80)}`)
  }

  const componentIds = new Set(recipe.components.map((c) => c.id))
  const stepIds = new Set(recipe.steps.map((s) => s.id))
  const images = new Set(facts.imagesBySlug[recipe.slug] ?? [])
  const used = new Set<string>()
  for (const step of recipe.steps) {
    const at = `${where}:${step.id}`
    if (!componentIds.has(step.component)) error(at, `unknown component '${step.component}'`)
    const refs = [...textTokens(step.text), ...step.substeps.flatMap(textTokens), ...step.uses]
    for (const ref of refs) {
      used.add(ref)
      if (!lines.has(ref)) error(at, `unknown ingredient line '${ref}'`)
    }
    for (const after of step.after ?? []) if (!stepIds.has(after)) error(at, `unknown step '${after}' in after`)
    for (const st of step.tools) {
      for (const tool of [st.tool, ...st.alternatives]) if (!toolIds.has(tool)) error(at, `unknown tool '${tool}'`)
    }
    for (const photo of step.photos) if (!images.has(photo.file)) error(at, `missing image '${photo.file}'`)
    if (step.kind === 'cook' && step.active_min + step.passive_min > 0 && !step.cue) {
      warn(at, 'timed cook step has no sensory cue')
    }
  }
  for (const comp of recipe.components) {
    if (!recipe.steps.some((s) => s.component === comp.id)) warn(where, `component '${comp.id}' has no steps`)
  }
  for (const id of lines.keys()) if (!used.has(id)) warn(`${where}:${id}`, 'ingredient line is never used by a step')

  const referenced = new Set([...recipe.images, ...recipe.steps.flatMap((s) => s.photos)].map((i) => i.file))
  for (const image of recipe.images) if (!images.has(image.file)) error(where, `missing image '${image.file}'`)
  for (const file of images) {
    if (IMAGE_SUFFIX.test(file) && !referenced.has(file)) warn(where, `image '${file}' is not referenced`)
  }

  try {
    computeSchedule(recipe)
  } catch (e) {
    error(where, e instanceof Error ? e.message : String(e))
    return
  }
  const nutrition = estimateNutrition(recipe, ingredients)
  if (!nutrition) warn(where, 'no nutrition estimate: no ingredient has usable data')
  else if (nutrition.coverage < 0.9) {
    warn(
      where,
      `nutrition covers ${Math.round(nutrition.coverage * 100)}% of mass; missing ${nutrition.missing.join(', ')}`,
    )
  }
}

/** Cross-reference checks the schema alone cannot express. This is what `make doctor` reports. */
export function validateLibrary(lib: Catalog, facts: FileFacts): Issue[] {
  const issues: Issue[] = []
  checkTaxonomy(lib, issues)
  for (const dup of duplicates(lib.recipes.map((r) => r.slug))) {
    issues.push({ severity: 'error', where: 'recipes', message: `duplicate slug '${dup}'` })
  }
  for (const recipe of lib.recipes) checkRecipe(recipe, lib, facts, issues)
  return issues
}
