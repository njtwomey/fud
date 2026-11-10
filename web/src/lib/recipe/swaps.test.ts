import { describe, expect, it } from 'vitest'
import { makeCatalog, makeRecipe } from '../testing/fixtures'
import { estimateNutrition } from './nutrition'
import { buildShoppingList } from './shopping'
import { applySwaps, swapOptions } from './swaps'

const catalog = makeCatalog()
const recipe = makeRecipe()
const line = recipe.components[0]!.ingredients.find((l) => l.id === 'rice')!

describe('swapOptions', () => {
  it('lists the recipe-specific swaps first, then general ones, without repeats', () => {
    const options = swapOptions(
      { ingredient: 'rice', swaps: [{ ingredient: 'cumin', ratio: 1, quality: 'fine' }] },
      catalog.swaps,
    )
    expect(options.map((o) => o.ingredient)).toEqual(['cumin', 'jasmine-rice'])
    const dup = swapOptions(
      { ingredient: 'rice', swaps: [{ ingredient: 'jasmine-rice', ratio: 2, quality: 'close' }] },
      catalog.swaps,
    )
    expect(dup).toHaveLength(1)
    expect(dup[0]?.ratio).toBe(2)
  })
  it('is empty when nothing applies', () => {
    expect(swapOptions({ ingredient: 'oil', swaps: [] }, catalog.swaps)).toEqual([])
  })
})

describe('applySwaps', () => {
  it('returns the same recipe when nothing is chosen', () => {
    expect(applySwaps(recipe, {})).toBe(recipe)
  })

  it('replaces the ingredient and scales the amount by the ratio, leaving other lines alone', () => {
    const swapped = applySwaps(recipe, { rice: { ingredient: 'jasmine-rice', ratio: 1.5, quality: 'fine' } })
    const rice = swapped.components[0]!.ingredients.find((l) => l.id === 'rice')!
    expect(rice.ingredient).toBe('jasmine-rice')
    expect(rice.quantity).toEqual({ amount: 300, unit: 'g' })
    expect(swapped.components[0]!.ingredients.find((l) => l.id === 'garlic')).toEqual(
      recipe.components[0]!.ingredients.find((l) => l.id === 'garlic'),
    )
    expect(line.ingredient).toBe('rice') // the original is not mutated
  })

  it('flows through to the shopping list and nutrition', () => {
    const swapped = applySwaps(recipe, { rice: { ingredient: 'jasmine-rice', ratio: 1, quality: 'fine' } })
    const items = buildShoppingList([{ recipe: swapped, servings: 2 }])
    expect(items.some((i) => i.ingredient === 'jasmine-rice')).toBe(true)
    expect(items.some((i) => i.ingredient === 'rice')).toBe(false)
    const ingredients = new Map(catalog.ingredients.map((i) => [i.id, i]))
    // jasmine rice has no protein figure in the fixture, so protein drops out.
    expect(estimateNutrition(swapped, ingredients)?.perServing.protein_g).toBe(0)
  })

  it('keeps no-quantity lines without a quantity', () => {
    const input = structuredClone(recipe)
    const l = input.components[0]!.ingredients.find((x) => x.id === 'oil')!
    delete l.quantity
    const swapped = applySwaps(input, { oil: { ingredient: 'cumin', ratio: 2, quality: 'fine' } })
    expect(swapped.components[0]!.ingredients.find((x) => x.id === 'oil')?.quantity).toBeUndefined()
  })
})
