import type { Ingredient, Recipe, Vocab } from '../schema'
import { type BaseUnit, toBase } from './units'

export interface ShoppingItem {
  ingredient: string
  unit: BaseUnit
  amount: number
  /** Lines with no quantity ('to taste'), listed so they are not forgotten. */
  unquantified: boolean
}

export interface PlannedRecipe {
  recipe: Recipe
  servings: number
}

/** Sum ingredients across planned recipes, scaled to each plan's servings. Optional lines are skipped. */
export function buildShoppingList(plan: PlannedRecipe[]): ShoppingItem[] {
  const items = new Map<string, ShoppingItem>()
  for (const { recipe, servings } of plan) {
    const factor = servings / recipe.servings
    for (const component of recipe.components) {
      for (const line of component.ingredients) {
        if (line.optional) continue
        if (!line.quantity) {
          const key = `${line.ingredient}|none`
          if (!items.has(key)) items.set(key, { ingredient: line.ingredient, unit: 'g', amount: 0, unquantified: true })
          continue
        }
        const base = toBase(line.quantity)
        const key = `${line.ingredient}|${base.unit}`
        const existing = items.get(key)
        if (existing) existing.amount += base.amount * factor
        else
          items.set(key, {
            ingredient: line.ingredient,
            unit: base.unit,
            amount: base.amount * factor,
            unquantified: false,
          })
      }
    }
  }
  // A quantified line makes the "to taste" line redundant.
  for (const [key, item] of [...items]) {
    if (item.unquantified && [...items.values()].some((o) => o.ingredient === item.ingredient && !o.unquantified)) {
      items.delete(key)
    }
  }
  return [...items.values()]
}

/** Group items by category in the order categories are listed in the data (the shop-walking order). */
export function groupByCategory(
  items: ShoppingItem[],
  ingredients: ReadonlyMap<string, Ingredient>,
  categories: readonly Vocab[],
): [Vocab, ShoppingItem[]][] {
  const groups = new Map<string, ShoppingItem[]>()
  for (const item of items) {
    const id = ingredients.get(item.ingredient)?.category ?? 'unknown'
    groups.set(id, [...(groups.get(id) ?? []), item])
  }
  const known = categories
    .filter((c) => groups.has(c.id))
    .map((c): [Vocab, ShoppingItem[]] => [c, groups.get(c.id) ?? []])
  const knownIds = new Set(categories.map((c) => c.id))
  const rest = [...groups]
    .filter(([id]) => !knownIds.has(id))
    .map(([id, list]): [Vocab, ShoppingItem[]] => [{ id, label: id }, list])
  return [...known, ...rest]
}
