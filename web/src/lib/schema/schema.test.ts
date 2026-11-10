import { describe, expect, it } from 'vitest'
import { makeRecipeInput } from '../testing/fixtures'
import { Quantity, Recipe, Slug } from './index'

describe('schema', () => {
  it('accepts metric units plus tsp and tbsp, and nothing imperial', () => {
    for (const unit of ['g', 'kg', 'ml', 'l', 'each', 'tsp', 'tbsp']) {
      expect(Quantity.safeParse({ amount: 1, unit }).success).toBe(true)
    }
    for (const unit of ['cup', 'oz', 'lb', 'pint', 'fl oz']) {
      expect(Quantity.safeParse({ amount: 1, unit }).success).toBe(false)
    }
  })

  it('rejects the removed prep field on ingredient lines and requires a step title', () => {
    const withPrep = makeRecipeInput() as { components: { ingredients: Record<string, unknown>[] }[] }
    withPrep.components[0]!.ingredients[0]!.prep = 'finely diced'
    expect(Recipe.safeParse(withPrep).success).toBe(false)
    const noTitle = makeRecipeInput() as { steps: Record<string, unknown>[] }
    delete noTitle.steps[0]!.title
    expect(Recipe.safeParse(noTitle).success).toBe(false)
  })

  it('rejects non-positive amounts', () => {
    expect(Quantity.safeParse({ amount: 0, unit: 'g' }).success).toBe(false)
    expect(Quantity.safeParse({ amount: -5, unit: 'g' }).success).toBe(false)
  })

  it('requires kebab-case slugs', () => {
    expect(Slug.safeParse('red-pepper').success).toBe(true)
    for (const bad of ['Red Pepper', 'red_pepper', '-x', 'x-', '']) expect(Slug.safeParse(bad).success).toBe(false)
  })

  it('rejects unknown keys so typos do not pass silently', () => {
    const input = { ...(makeRecipeInput() as object), servngs: 4 }
    expect(Recipe.safeParse(input).success).toBe(false)
  })

  it('rejects duplicate ids within a recipe', () => {
    const input = makeRecipeInput() as { steps: { id: string }[] }
    input.steps[1]!.id = input.steps[0]!.id
    const result = Recipe.safeParse(input)
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toContain("duplicate step id 'slice'")
  })

  it('applies defaults for optional structure', () => {
    const recipe = Recipe.parse(makeRecipeInput())
    expect(recipe.version).toBe(1)
    expect(recipe.status).toBe('draft')
    expect(recipe.steps[0]?.substeps).toEqual([])
  })
})
