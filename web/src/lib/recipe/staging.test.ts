import { describe, expect, it } from 'vitest'
import { Ingredient, SwapRule, Tag, Tool } from '../schema'
import { makeCatalog } from '../testing/fixtures'
import { mergeAdditions, type Taxonomy } from './staging'

const base = (): Taxonomy => {
  const c = structuredClone(makeCatalog())
  return { ingredients: c.ingredients, tools: c.tools, tags: c.tags, swaps: c.swaps }
}
const ing = (id: string, name = id, aliases: string[] = []) =>
  Ingredient.parse({ id, name, category: 'produce', aliases })

describe('mergeAdditions', () => {
  it('appends new entries from every addition set', () => {
    const { merged, notes } = mergeAdditions(base(), [
      { ingredients: [ing('leek')], tools: [Tool.parse({ id: 'whisk', name: 'whisk', category: 'prep' })] },
      { tags: [Tag.parse({ id: 'soup', label: 'Soup', domain: 'course' })] },
    ])
    expect(merged.ingredients.map((i) => i.id)).toContain('leek')
    expect(merged.tools.map((t) => t.id)).toContain('whisk')
    expect(merged.tags.map((t) => t.id)).toContain('soup')
    expect(notes).toEqual([])
  })

  it('keeps the first definition of an id and reports the later one', () => {
    const { merged, notes } = mergeAdditions(base(), [
      { ingredients: [ing('leek', 'leek')] },
      { ingredients: [ing('leek', 'leeks')] },
    ])
    expect(merged.ingredients.filter((i) => i.id === 'leek')).toHaveLength(1)
    expect(merged.ingredients.find((i) => i.id === 'leek')?.name).toBe('leek')
    expect(notes).toEqual(["ingredient 'leek' already exists with a different definition; kept the first"])
  })

  it('does not call an identical repeat a conflict', () => {
    const { notes } = mergeAdditions(base(), [{ ingredients: [ing('leek')] }, { ingredients: [ing('leek')] }])
    expect(notes).toEqual(["ingredient 'leek' already exists"])
  })

  it('reports name and alias clashes between different ids but keeps both', () => {
    const { merged, notes } = mergeAdditions(base(), [{ ingredients: [ing('green-onion', 'green onion', ['Garlic'])] }])
    expect(merged.ingredients.some((i) => i.id === 'green-onion')).toBe(true)
    expect(notes.some((n) => n.includes('possible duplicate') && n.includes("'garlic'"))).toBe(true)
  })

  it('combines swap rules for the same ingredient and does not repeat alternatives', () => {
    const rule = (ingredient: string) =>
      SwapRule.parse({ ingredient, alternatives: [{ ingredient, ratio: 1 }] }).alternatives[0]!
    const { merged } = mergeAdditions(base(), [
      { swaps: [{ ingredient: 'rice', alternatives: [rule('cumin'), rule('jasmine-rice')] }] },
    ])
    const rice = merged.swaps.find((s) => s.ingredient === 'rice')!
    expect(rice.alternatives.map((a) => a.ingredient)).toEqual(['jasmine-rice', 'cumin'])
  })

  it('does not change the base it was given', () => {
    const b = base()
    mergeAdditions(b, [{ ingredients: [ing('leek')] }])
    expect(b.ingredients.some((i) => i.id === 'leek')).toBe(false)
  })
})
