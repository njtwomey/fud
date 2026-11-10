import { describe, expect, it } from 'vitest'
import type { Catalog } from '../schema'
import { makeCatalog } from '../testing/fixtures'
import { type FileFacts, validateLibrary } from './validate'

const facts: FileFacts = { folderBySlug: { 'garlic-rice': 'garlic-rice' }, imagesBySlug: { 'garlic-rice': [] } }

function withRecipe(mutate: (r: Record<string, any>) => void): Catalog {
  const catalog = structuredClone(makeCatalog()) as Record<string, any>
  mutate(catalog.recipes[0])
  return catalog as Catalog
}
const messages = (catalog: Catalog, f: FileFacts = facts) =>
  validateLibrary(catalog, f).map((i) => `${i.severity}: ${i.message}`)

describe('validateLibrary', () => {
  it('accepts the fixture library', () => {
    expect(validateLibrary(makeCatalog(), facts).filter((i) => i.severity === 'error')).toEqual([])
  })

  it('rejects ingredients that are not in the taxonomy', () => {
    const c = withRecipe((r) => {
      r.components[0].ingredients[0].ingredient = 'mystery-powder'
    })
    expect(messages(c)).toContain("error: unknown ingredient 'mystery-powder'")
  })

  it('rejects ingredient categories and tag domains that are not defined in the data', () => {
    const c = structuredClone(makeCatalog())
    c.ingredients[0]!.category = 'sundries'
    c.tags[0]!.domain = 'mood'
    const out = messages(c)
    expect(out).toContain("error: unknown category 'sundries'")
    expect(out).toContain("error: unknown domain 'mood'")
  })

  it('rejects tool categories, swap qualities, statuses and source kinds that are not defined in the data', () => {
    const c = structuredClone(makeCatalog())
    c.tools[0]!.category = 'gadgets'
    c.swaps[0]!.alternatives[0]!.quality = 'magical'
    const recipe = c.recipes[0]!
    recipe.status = 'perfect'
    recipe.source = { kind: 'telepathy' }
    const out = messages(c)
    expect(out).toContain("error: unknown category 'gadgets'")
    expect(out).toContain("error: unknown swap quality 'magical'")
    expect(out).toContain("error: unknown status 'perfect'")
    expect(out).toContain("error: unknown source kind 'telepathy'")
  })

  it('rejects unknown tags, tools, steps, lines and components', () => {
    const c = withRecipe((r) => {
      r.tags.push('nope')
      r.steps[1].tools[0].tool = 'blender'
      r.steps[0].after = ['ghost']
      r.steps[2].text = 'Fry {ghost-line}.'
      r.steps[3].component = 'missing'
    })
    const out = messages(c)
    expect(out).toContain("error: unknown tag 'nope'")
    expect(out).toContain("error: unknown tool 'blender'")
    expect(out).toContain("error: unknown step 'ghost' in after")
    expect(out).toContain("error: unknown ingredient line 'ghost-line'")
    expect(out).toContain("error: unknown component 'missing'")
  })

  it('allows tsp and tbsp only for categories that opt in', () => {
    const spoon = (id: string) =>
      withRecipe((r) => {
        r.components[0].ingredients[0].ingredient = id
        r.components[0].ingredients[0].quantity = { amount: 1, unit: 'tsp' }
      })
    expect(messages(spoon('cumin')).filter((m) => m.startsWith('error:'))).toEqual([])
    expect(messages(spoon('garlic'))).toContain(
      "error: 'garlic' is in category 'produce', which does not allow tsp or tbsp",
    )
  })

  it('warns when a spoon-measured ingredient has no density for nutrition', () => {
    const c = withRecipe((r) => {
      r.components[0].ingredients[0].ingredient = 'cumin'
      r.components[0].ingredients[0].quantity = { amount: 1, unit: 'tsp' }
    })
    c.ingredients.find((i) => i.id === 'cumin')!.density_g_per_ml = undefined
    expect(messages(c).some((m) => m.startsWith('warning:') && m.includes('has no density'))).toBe(true)
  })

  it('rejects text that says where a recipe came from', () => {
    for (const text of ['From the cookbook.', 'The Mealie copy is sweeter.', 'Written up in the recipe project.']) {
      const c = withRecipe((r) => {
        r.notes = [text]
      })
      expect(messages(c).some((m) => m.startsWith('error:') && m.includes('where the recipe came from'))).toBe(true)
    }
  })

  it('rejects text that sends the reader to another recipe, wherever it appears', () => {
    const phrases = [
      '(see the Potatoes recipe)',
      'Make the slaw following the rainbow slaw recipe.',
      'As in the basmati rice recipe.',
      'See that recipe for the sauce.',
    ]
    for (const text of phrases) {
      const inNote = withRecipe((r) => {
        r.notes = [text]
      })
      const inStep = withRecipe((r) => {
        r.steps[0].substeps = [text]
      })
      for (const c of [inNote, inStep]) {
        expect(messages(c).some((m) => m.startsWith('error:') && m.includes('refers to another recipe'))).toBe(true)
      }
    }
  })

  it('allows ordinary uses of the word recipe', () => {
    const c = withRecipe((r) => {
      r.notes = ['This recipe scales well.', 'Double the recipe for a crowd.']
    })
    expect(messages(c).filter((m) => m.startsWith('error:'))).toEqual([])
  })

  it('requires each_g before a quantity can use each', () => {
    const c = withRecipe((r) => {
      r.components[0].ingredients[0].quantity = { amount: 2, unit: 'each' }
    })
    expect(messages(c).some((m) => m.startsWith('error:') && m.includes('no each_g'))).toBe(true)
  })

  it('reports dependency cycles', () => {
    const c = withRecipe((r) => {
      r.steps[0].after = ['serve']
    })
    expect(messages(c).some((m) => m.includes('cycle'))).toBe(true)
  })

  it('checks slug against folder and images against disk', () => {
    const c = withRecipe((r) => {
      r.images = [{ file: 'missing.jpg', alt: 'x' }]
    })
    const out = messages(c, {
      folderBySlug: { 'garlic-rice': 'other-folder' },
      imagesBySlug: { 'garlic-rice': ['stray.jpg'] },
    })
    expect(out).toContain("error: slug 'garlic-rice' does not match folder 'other-folder'")
    expect(out).toContain("error: missing image 'missing.jpg'")
    expect(out).toContain("warning: image 'stray.jpg' is not referenced")
  })

  it('warns about timed cook steps with no cue and unused lines', () => {
    const c = withRecipe((r) => {
      delete r.steps[1].cue
      r.steps[2].text = 'Fry.'
    })
    const out = messages(c)
    expect(out).toContain('warning: timed cook step has no sensory cue')
    expect(out).toContain('warning: ingredient line is never used by a step')
  })
})
