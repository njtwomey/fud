import { describe, expect, it } from 'vitest'
import { makeCatalog, makeRecipe } from '../testing/fixtures'
import { estimateNutrition } from './nutrition'

const ingredients = new Map(makeCatalog().ingredients.map((i) => [i.id, i]))

describe('estimateNutrition', () => {
  it('sums per-100 g values over the lines and divides by servings', () => {
    const result = estimateNutrition(makeRecipe(), ingredients)
    // rice 200 g * 3.5 + garlic 10 g * 1.5 + oil 20 ml * 0.9 g/ml * 9 = 700 + 15 + 162 = 877; 2 servings.
    expect(result?.perServing.kcal).toBe(438.5)
    expect(result?.perServing.protein_g).toBe(8)
    expect(result?.coverage).toBe(1)
  })

  it('ignores optional lines', () => {
    const result = estimateNutrition(makeRecipe(), ingredients)
    expect(result?.missing).not.toContain('red-pepper')
  })

  it('reports ingredients it could not use and lowers coverage', () => {
    const noDensity = new Map(ingredients)
    noDensity.set('oil', { ...ingredients.get('oil')!, density_g_per_ml: undefined })
    const result = estimateNutrition(makeRecipe(), noDensity)
    expect(result?.missing).toEqual(['oil'])
  })

  it('returns undefined when nothing has data', () => {
    expect(estimateNutrition(makeRecipe(), new Map())).toBeUndefined()
  })

  it('uses the requested servings for the divisor', () => {
    expect(estimateNutrition(makeRecipe(), ingredients, 1)?.perServing.kcal).toBe(877)
  })
})
