import type { Ingredient, SwapRule, Tag, Tool } from '../schema'

/** Taxonomy entries proposed by someone adding recipes, kept apart from the main data until merged. */
export interface Additions {
  ingredients?: Ingredient[]
  tools?: Tool[]
  tags?: Tag[]
  swaps?: SwapRule[]
}

export type Taxonomy = Required<Additions>

export interface MergeResult {
  merged: Taxonomy
  /** Entries dropped because the id already exists (first definition wins), and other things worth a look. */
  notes: string[]
}

const norm = (s: string) => s.trim().toLowerCase()

/**
 * Fold several sets of proposed entries into the base taxonomy. The first definition of an id wins; later ones are
 * reported, not applied. Swap rules for the same ingredient are combined. Name or alias clashes between different
 * ids are reported but kept, since only a person can decide whether they are really the same ingredient.
 */
export function mergeAdditions(base: Taxonomy, additions: readonly Additions[]): MergeResult {
  const merged: Taxonomy = {
    ingredients: [...base.ingredients],
    tools: [...base.tools],
    tags: [...base.tags],
    swaps: base.swaps.map((r) => ({ ...r, alternatives: [...r.alternatives] })),
  }
  const notes: string[] = []

  const addById = <T extends { id: string }>(label: string, into: T[], items: T[] | undefined) => {
    for (const item of items ?? []) {
      const existing = into.find((x) => x.id === item.id)
      if (existing) {
        const same = JSON.stringify(existing) === JSON.stringify(item)
        notes.push(`${label} '${item.id}' already exists${same ? '' : ' with a different definition; kept the first'}`)
      } else into.push(item)
    }
  }

  for (const add of additions) {
    for (const item of add.ingredients ?? []) {
      const names = new Map(
        merged.ingredients.flatMap((i) => [i.name, ...i.aliases].map((n) => [norm(n), i.id] as const)),
      )
      const clash = [item.name, ...item.aliases].map(norm).find((n) => names.has(n) && names.get(n) !== item.id)
      if (clash)
        notes.push(`ingredient '${item.id}' shares the name '${clash}' with '${names.get(clash)}': possible duplicate`)
      addById('ingredient', merged.ingredients, [item])
    }
    addById('tool', merged.tools, add.tools)
    addById('tag', merged.tags, add.tags)
    for (const rule of add.swaps ?? []) {
      const existing = merged.swaps.find((r) => r.ingredient === rule.ingredient)
      if (!existing) {
        merged.swaps.push({ ...rule, alternatives: [...rule.alternatives] })
        continue
      }
      for (const alt of rule.alternatives) {
        if (!existing.alternatives.some((a) => a.ingredient === alt.ingredient)) existing.alternatives.push(alt)
      }
    }
  }
  return { merged, notes }
}
