import type { Recipe, Step } from '../schema'

export type MethodView = 'written' | 'prep-first' | 'by-phase'

export interface StepGroup {
  key: string
  title: string | null
  steps: Step[]
}

/**
 * Arrange the same steps three ways:
 * - `written`: one list in the order the author wrote them (prep and cooking interleaved).
 * - `prep-first`: every prep step first, then everything else in written order.
 * - `by-phase`: one group per component, matching the ingredient groups.
 */
export function groupSteps(recipe: Recipe, view: MethodView): StepGroup[] {
  switch (view) {
    case 'written':
      return [{ key: 'all', title: null, steps: recipe.steps }]
    case 'prep-first': {
      const prep = recipe.steps.filter((s) => s.kind === 'prep')
      const rest = recipe.steps.filter((s) => s.kind !== 'prep')
      return [
        { key: 'prep', title: 'Prepare first', steps: prep },
        { key: 'cook', title: 'Cook', steps: rest },
      ].filter((g) => g.steps.length > 0)
    }
    case 'by-phase':
      return recipe.components
        .map((c) => ({ key: c.id, title: c.title, steps: recipe.steps.filter((s) => s.component === c.id) }))
        .filter((g) => g.steps.length > 0)
  }
}
