import { describe, expect, it } from 'vitest'
import { firstUndoneIndex, usedLineIds } from './progress'

const step = (id: string, text: string, uses: string[] = []) => ({ id, text, substeps: [], uses })
const steps = [
  step('chop', 'Chop {onion}.'),
  step('fry', 'Fry {onion} in {oil}.'),
  step('serve', 'Add {parsley} and serve.', ['oil']),
]

describe('usedLineIds', () => {
  it('uses nothing up before any step is done', () => {
    expect(usedLineIds(steps, new Set())).toEqual(new Set())
  })

  it('keeps a line until every step that uses it is done', () => {
    expect(usedLineIds(steps, new Set(['chop']))).toEqual(new Set())
    expect(usedLineIds(steps, new Set(['chop', 'fry']))).toEqual(new Set(['onion']))
  })

  it('counts `uses` as well as tokens, and brings a line back when a step is undone', () => {
    expect(usedLineIds(steps, new Set(['chop', 'fry', 'serve']))).toEqual(new Set(['onion', 'oil', 'parsley']))
    expect(usedLineIds(steps, new Set(['chop', 'fry']))).not.toContain('oil')
    expect(usedLineIds(steps, new Set(['fry', 'serve']))).toEqual(new Set(['oil', 'parsley']))
  })
})

describe('firstUndoneIndex', () => {
  it('finds the first step still to do', () => {
    expect(firstUndoneIndex(steps, new Set())).toBe(0)
    expect(firstUndoneIndex(steps, new Set(['chop']))).toBe(1)
    expect(firstUndoneIndex(steps, new Set(['chop', 'serve']))).toBe(1)
  })

  it('starts again from the top when everything is done', () => {
    expect(firstUndoneIndex(steps, new Set(['chop', 'fry', 'serve']))).toBe(0)
    expect(firstUndoneIndex([], new Set())).toBe(0)
  })
})
