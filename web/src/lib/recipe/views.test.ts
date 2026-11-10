import { describe, expect, it } from 'vitest'
import { makeRecipe } from '../testing/fixtures'
import { plainText, splitTokens, stepLineIds, textTokens } from './text'
import { groupSteps } from './views'

describe('groupSteps', () => {
  const recipe = makeRecipe()
  it('keeps written order in one untitled group', () => {
    const groups = groupSteps(recipe, 'written')
    expect(groups).toHaveLength(1)
    expect(groups[0]?.steps.map((s) => s.id)).toEqual(['slice', 'boil', 'fry', 'serve'])
  })
  it('puts every prep step first', () => {
    const groups = groupSteps(recipe, 'prep-first')
    expect(groups.map((g) => g.title)).toEqual(['Prepare first', 'Cook'])
    expect(groups[0]?.steps.map((s) => s.id)).toEqual(['slice'])
    expect(groups[1]?.steps.map((s) => s.id)).toEqual(['boil', 'fry', 'serve'])
  })
  it('groups by component using component titles', () => {
    const groups = groupSteps(recipe, 'by-phase')
    expect(groups.map((g) => g.title)).toEqual(['For the rice'])
  })
})

describe('text tokens', () => {
  it('finds, splits and replaces ingredient references', () => {
    expect(textTokens('Fry {garlic} in {oil}.')).toEqual(['garlic', 'oil'])
    expect(splitTokens('Fry {garlic} now')).toEqual([
      { type: 'text', value: 'Fry ' },
      { type: 'ref', id: 'garlic', form: 'full' },
      { type: 'text', value: ' now' },
    ])
    expect(plainText('Fry {garlic}.', () => 'garlic')).toBe('Fry garlic.')
    expect(textTokens('Add the {garlic:name} and {oil}.')).toEqual(['garlic', 'oil'])
    expect(splitTokens('the {garlic:name}')).toEqual([
      { type: 'text', value: 'the ' },
      { type: 'ref', id: 'garlic', form: 'name' },
    ])
  })
  it('collects ids from text, substeps and uses', () => {
    expect(stepLineIds({ text: 'a {x}', substeps: ['b {y}'], uses: ['z'] })).toEqual(new Set(['x', 'y', 'z']))
  })
})
