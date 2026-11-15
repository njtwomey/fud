import { stepLineIds } from './text'

interface StepLike {
  id: string
  text: string
  substeps: string[]
  uses: string[]
}

/**
 * Ingredient lines that have been used up: at least one step uses the line and every step that uses it is done.
 * Undoing a step brings its ingredients back. Lines no step mentions are never "used", since nothing says when.
 */
export function usedLineIds(steps: readonly StepLike[], done: ReadonlySet<string>): Set<string> {
  const remaining = new Set<string>()
  const seen = new Set<string>()
  for (const step of steps) {
    for (const id of stepLineIds(step)) {
      seen.add(id)
      if (!done.has(step.id)) remaining.add(id)
    }
  }
  return new Set([...seen].filter((id) => !remaining.has(id)))
}

/** Index of the first step that is not done yet, or 0 when everything is done (or there are no steps). */
export function firstUndoneIndex(steps: readonly { id: string }[], done: ReadonlySet<string>): number {
  const index = steps.findIndex((s) => !done.has(s.id))
  return index === -1 ? 0 : index
}
