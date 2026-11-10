import { describe, expect, it } from 'vitest'
import { makeCatalog, makeRecipe } from '../testing/fixtures'
import { buildShoppingList, groupByCategory } from './shopping'

const catalog = makeCatalog()
const ingredients = new Map(catalog.ingredients.map((i) => [i.id, i]))

describe('buildShoppingList', () => {
  it('scales by servings, sums across recipes and skips optional lines', () => {
    const items = buildShoppingList([
      { recipe: makeRecipe(), servings: 4 },
      { recipe: makeRecipe(), servings: 2 },
    ])
    expect(items.find((i) => i.ingredient === 'rice')).toMatchObject({ unit: 'g', amount: 600 })
    expect(items.find((i) => i.ingredient === 'garlic')).toMatchObject({ unit: 'each', amount: 6 })
    expect(items.some((i) => i.ingredient === 'red-pepper')).toBe(false)
  })
})

describe('groupByCategory', () => {
  it('orders groups by the category order in the data, with labels from the data', () => {
    const items = buildShoppingList([{ recipe: makeRecipe(), servings: 2 }])
    const groups = groupByCategory(items, ingredients, catalog.categories)
    expect(groups.map(([c]) => c.label)).toEqual(['Fruit and veg', 'Rice, grains and pasta', 'Oils and fats'])
  })
  it('puts items with an unknown category last instead of dropping them', () => {
    const items = buildShoppingList([{ recipe: makeRecipe(), servings: 2 }])
    const groups = groupByCategory(items, ingredients, [])
    expect(groups.at(-1)?.[0].id).toBeDefined()
    expect(groups.flatMap(([, list]) => list)).toHaveLength(items.length)
  })
})
