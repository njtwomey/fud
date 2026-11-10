import { useCallback } from 'react'
import { useLocalStorage } from './hooks/use-local-storage'
import type { SwapOption } from './schema'

export interface PlanItem {
  slug: string
  servings: number
  /** Ingredient swaps chosen for this recipe, by ingredient line id. */
  swaps?: Record<string, SwapOption>
}

/** The recipes chosen for shopping, with servings, kept in the browser. */
export function usePlan() {
  const [plan, setPlan] = useLocalStorage<PlanItem[]>('plan', [])
  const add = useCallback(
    (item: PlanItem) => setPlan((prev) => [...prev.filter((p) => p.slug !== item.slug), item]),
    [setPlan],
  )
  const remove = useCallback((slug: string) => setPlan((prev) => prev.filter((p) => p.slug !== slug)), [setPlan])
  const setServings = useCallback(
    (slug: string, servings: number) => setPlan((prev) => prev.map((p) => (p.slug === slug ? { ...p, servings } : p))),
    [setPlan],
  )
  const clear = useCallback(() => setPlan([]), [setPlan])
  return {
    plan,
    add,
    remove,
    setServings,
    clear,
    has: (slug: string) => plan.some((p) => p.slug === slug),
    get: (slug: string) => plan.find((p) => p.slug === slug),
  }
}
