import { describe, expect, it } from 'vitest'
import { makeCatalog } from '../testing/fixtures'
import { addMinutesToClock, describeQuantity, formatDuration, formatQuantity, toBase, toGrams } from './units'

const { ingredients } = makeCatalog()
const garlic = ingredients.find((i) => i.id === 'garlic')!
const pepper = ingredients.find((i) => i.id === 'red-pepper')!
const rice = ingredients.find((i) => i.id === 'rice')!
const oil = ingredients.find((i) => i.id === 'oil')!
const cumin = ingredients.find((i) => i.id === 'cumin')!

describe('units', () => {
  it('normalises kg and l to g and ml', () => {
    expect(toBase({ amount: 1.5, unit: 'kg' })).toEqual({ amount: 1500, unit: 'g' })
    expect(toBase({ amount: 2, unit: 'l' })).toEqual({ amount: 2000, unit: 'ml' })
  })

  it('converts to grams using density and each weight, or gives up', () => {
    expect(toGrams({ amount: 100, unit: 'ml' }, oil)).toBeCloseTo(90)
    expect(toGrams({ amount: 3, unit: 'each' }, garlic)).toBe(15)
    expect(toGrams({ amount: 100, unit: 'ml' }, rice)).toBeUndefined()
  })

  it('scales and formats quantities sensibly', () => {
    expect(formatQuantity({ amount: 300, unit: 'g' }, 2)).toBe('600 g')
    expect(formatQuantity({ amount: 600, unit: 'g' }, 2)).toBe('1.2 kg')
    expect(formatQuantity({ amount: 500, unit: 'ml' }, 3)).toBe('1.5 l')
    expect(formatQuantity({ amount: 2.5, unit: 'g' }, 1)).toBe('2.5 g')
  })

  it('keeps teaspoons and tablespoons for spices, in quarters, promoting to tablespoons', () => {
    expect(toBase({ amount: 2, unit: 'tbsp' })).toEqual({ amount: 6, unit: 'tsp' })
    expect(formatQuantity({ amount: 1, unit: 'tsp' }, 1)).toBe('1 tsp')
    expect(formatQuantity({ amount: 0.5, unit: 'tsp' }, 1)).toBe('½ tsp')
    expect(formatQuantity({ amount: 1, unit: 'tsp' }, 1.5)).toBe('1½ tsp')
    expect(formatQuantity({ amount: 1, unit: 'tsp' }, 0.25)).toBe('¼ tsp')
    expect(formatQuantity({ amount: 1, unit: 'tsp' }, 3)).toBe('1 tbsp')
    expect(formatQuantity({ amount: 1, unit: 'tbsp' }, 2)).toBe('2 tbsp')
    expect(describeQuantity({ amount: 1, unit: 'tsp' }, 2, cumin)).toBe('2 tsp ground cumin')
  })

  it('converts spoons to grams through the ingredient density', () => {
    // 2 tsp = 10 ml at 0.45 g/ml
    expect(toGrams({ amount: 2, unit: 'tsp' }, cumin)).toBeCloseTo(4.5)
    expect(toGrams({ amount: 1, unit: 'tbsp' }, cumin)).toBeCloseTo(6.75)
    expect(toGrams({ amount: 1, unit: 'tsp' }, rice)).toBeUndefined()
  })

  it('pluralises counted items by label', () => {
    expect(formatQuantity({ amount: 1, unit: 'each' }, 1, garlic)).toBe('1 clove')
    expect(formatQuantity({ amount: 3, unit: 'each' }, 1, garlic)).toBe('3 cloves')
    expect(formatQuantity({ amount: 1, unit: 'each' }, 1.5, garlic)).toBe('1½ cloves')
    expect(formatQuantity({ amount: 1, unit: 'each' }, 0.5, garlic)).toBe('½ clove')
  })

  it('describes lines with name, plural and no-quantity cases', () => {
    expect(describeQuantity({ amount: 200, unit: 'g' }, 1, rice)).toBe('200 g basmati rice')
    expect(describeQuantity({ amount: 2, unit: 'each' }, 1, garlic)).toBe('2 cloves garlic')
    expect(describeQuantity({ amount: 1, unit: 'each' }, 1, pepper)).toBe('1 red pepper')
    expect(describeQuantity({ amount: 1, unit: 'each' }, 2, pepper)).toBe('2 red peppers')
    expect(describeQuantity({ amount: 1, unit: 'each' }, 0.5, pepper)).toBe('½ red pepper')
    expect(describeQuantity({ amount: 1, unit: 'each' }, 1.5, pepper)).toBe('1½ red peppers')
    expect(describeQuantity(undefined, 1, rice)).toBe('basmati rice')
  })

  it('formats durations and clock times', () => {
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(60)).toBe('1 h')
    expect(formatDuration(95)).toBe('1 h 35 min')
    expect(addMinutesToClock('19:00', -45)).toBe('18:15')
    expect(addMinutesToClock('00:10', -20)).toBe('23:50')
  })
})
