import { splitTokens } from '../recipe/text'
import { describeQuantity } from '../recipe/units'
import type { Ingredient, IngredientLine } from '../schema'

interface StepTextProps {
  text: string
  lines: ReadonlyMap<string, IngredientLine>
  ingredients: ReadonlyMap<string, Ingredient>
  /** Servings divided by the recipe's base servings. */
  factor: number
}

/**
 * Step text with ingredient tokens filled in from the recipe as it will be cooked (so chosen swaps show through):
 * `{line-id}` becomes the scaled quantity and name in bold, `{line-id:name}` just the name.
 */
export function StepText({ text, lines, ingredients, factor }: StepTextProps) {
  return (
    <>
      {splitTokens(text).map((part, i) => {
        if (part.type === 'text') return part.value
        const line = lines.get(part.id)
        const ingredient = line && ingredients.get(line.ingredient)
        const key = `${part.id}-${i}`
        if (!line || !ingredient) return <span key={key}>{part.id}</span>
        if (part.form === 'name') return <span key={key}>{ingredient.name}</span>
        return (
          <strong key={key} className="font-semibold">
            {describeQuantity(line.quantity, factor, ingredient)}
          </strong>
        )
      })}
    </>
  )
}
