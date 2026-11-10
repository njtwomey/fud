import { type Ingredient, NUTRITION_FIELDS, type NutritionValues, type Recipe } from '../schema'
import { toGrams } from './units'

export interface NutritionEstimate {
  perServing: NutritionValues
  /** Share (0 to 1) of known ingredient mass that had nutrition data. */
  coverage: number
  /** Ingredient ids left out for lack of data or density. */
  missing: string[]
}

/** Estimate nutrition per serving from per-100 g taxonomy figures. Optional ingredients are ignored. */
export function estimateNutrition(
  recipe: Recipe,
  ingredients: ReadonlyMap<string, Ingredient>,
  servings: number = recipe.servings,
): NutritionEstimate | undefined {
  const totals: Record<(typeof NUTRITION_FIELDS)[number], number> = {
    kcal: 0,
    protein_g: 0,
    fat_g: 0,
    saturates_g: 0,
    carbs_g: 0,
    sugars_g: 0,
    fibre_g: 0,
    salt_g: 0,
  }
  let knownG = 0
  let coveredG = 0
  const missing = new Set<string>()
  for (const component of recipe.components) {
    for (const line of component.ingredients) {
      const ingredient = ingredients.get(line.ingredient)
      if (!ingredient || line.optional || !line.quantity) continue
      const grams = toGrams(line.quantity, ingredient)
      if (grams === undefined) {
        missing.add(line.ingredient)
        continue
      }
      knownG += grams
      if (!ingredient.nutrition) {
        missing.add(line.ingredient)
        continue
      }
      coveredG += grams
      for (const field of NUTRITION_FIELDS) {
        totals[field] += ((ingredient.nutrition[field] ?? 0) * grams) / 100
      }
    }
  }
  if (coveredG === 0) return undefined
  const perServing: NutritionValues = {}
  for (const field of NUTRITION_FIELDS) perServing[field] = Math.round((totals[field] / servings) * 10) / 10
  return { perServing, coverage: knownG ? coveredG / knownG : 0, missing: [...missing].sort() }
}
