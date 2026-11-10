import { describe, expect, it } from 'vitest'
import { Recipe } from '../schema'
import { makeRecipe, makeRecipeInput } from '../testing/fixtures'
import { activeMinutes, computeSchedule, stepDependencies, totalMinutes } from './schedule'

const entry = (id: string, recipe = makeRecipe()) => computeSchedule(recipe).find((e) => e.step === id)!

describe('computeSchedule', () => {
  it('starts steps with after: [] at zero, in parallel', () => {
    expect(entry('slice').start).toBe(0)
    expect(entry('boil').start).toBe(0)
  })

  it('waits for the slowest dependency', () => {
    // fry ends at 5 + 3 = 8, boil ends at 14: serve starts at 14.
    expect(entry('serve').start).toBe(14)
    expect(totalMinutes(computeSchedule(makeRecipe()))).toBe(15)
    expect(activeMinutes(makeRecipe())).toBe(11)
  })

  it('reports slack for steps that can be delayed without delaying the meal', () => {
    const fry = entry('fry')
    expect(fry.slack).toBe(14 - 8)
    expect(fry.latestStart).toBe(fry.start + fry.slack)
    expect(entry('boil').slack).toBe(0)
  })

  it('defaults to following the previous step in the same component', () => {
    const input = makeRecipeInput() as { steps: { after?: string[] }[] }
    for (const s of input.steps) delete s.after
    const recipe = Recipe.parse(input)
    expect(stepDependencies(recipe).get('fry')).toEqual(['boil'])
    expect(stepDependencies(recipe).get('slice')).toEqual([])
    // slice 0-5, boil 5-19, fry 19-22: each step waits for the one before it.
    expect(entry('boil', recipe).start).toBe(5)
    expect(entry('fry', recipe).start).toBe(19)
  })

  it('rejects dependency cycles and unknown steps', () => {
    const input = makeRecipeInput() as { steps: { id: string; after?: string[] }[] }
    const cyclic = structuredClone(input)
    cyclic.steps.find((s) => s.id === 'slice')!.after = ['serve']
    expect(() => computeSchedule(Recipe.parse(cyclic))).toThrow(/cycle/)
    const unknown = structuredClone(input)
    unknown.steps.find((s) => s.id === 'slice')!.after = ['nope']
    expect(() => computeSchedule(Recipe.parse(unknown))).toThrow(/unknown step/)
  })
})
