import type { Recipe, SwapOption, SwapRule } from '../schema'

/** The swaps the cook has chosen, by ingredient line id. A line with no entry uses the ingredient as written. */
export type ChosenSwaps = Readonly<Record<string, SwapOption>>

/** Swap options for a line: the recipe's own first, then the general ones for that ingredient, without repeats. */
export function swapOptions(
  line: { ingredient: string; swaps: readonly SwapOption[] },
  rules: readonly SwapRule[],
): SwapOption[] {
  const general = rules.find((r) => r.ingredient === line.ingredient)?.alternatives ?? []
  return [...line.swaps, ...general].filter((o, i, all) => all.findIndex((x) => x.ingredient === o.ingredient) === i)
}

/**
 * The recipe as it will be cooked: each chosen swap replaces the line's ingredient and scales its amount by the
 * swap's ratio. Everything derived from the recipe (step text, nutrition, equipment, shopping) uses this result.
 */
export function applySwaps(recipe: Recipe, chosen: ChosenSwaps): Recipe {
  if (Object.keys(chosen).length === 0) return recipe
  return {
    ...recipe,
    components: recipe.components.map((component) => ({
      ...component,
      ingredients: component.ingredients.map((line) => {
        const swap = chosen[line.id]
        if (!swap) return line
        return {
          ...line,
          ingredient: swap.ingredient,
          quantity: line.quantity && { ...line.quantity, amount: line.quantity.amount * swap.ratio },
          swaps: [],
        }
      }),
    })),
  }
}
