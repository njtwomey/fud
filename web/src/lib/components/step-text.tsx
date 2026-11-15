import { cn } from 'cn'
import { ChevronDown } from 'lucide-react'
import { splitTokens } from '../recipe/text'
import { describeQuantity } from '../recipe/units'
import type { Ingredient, IngredientLine, Technique } from '../schema'

interface StepTextProps {
  text: string
  lines: ReadonlyMap<string, IngredientLine>
  ingredients: ReadonlyMap<string, Ingredient>
  /** Servings divided by the recipe's base servings. */
  factor: number
  /** Known techniques. A marked word whose technique is missing from here is shown as plain text. */
  techniques?: ReadonlyMap<string, Technique>
  /** Ids of the techniques currently expanded, and the toggle for them. Without these, terms are plain text. */
  openTechniques?: ReadonlySet<string>
  onToggleTechnique?: (id: string) => void
  /** Prefix that makes each expander's `aria-controls` target unique on the page. */
  idPrefix?: string
}

/** The element id of the note a technique term controls. */
export const techniqueNoteId = (prefix: string, id: string) => `${prefix}-technique-${id}`

/**
 * Step text with its markup filled in from the recipe as it will be cooked (so chosen swaps show through):
 * `{line-id}` becomes the scaled quantity and name in bold, `{line-id:name}` just the name, and
 * `[[technique-id|words]]` the words as a quiet expander: a dotted underline and a small chevron that turn the
 * explanation on and off. The explanation itself is `TechniqueNote`, which the caller places where it should open.
 */
export function StepText({
  text,
  lines,
  ingredients,
  factor,
  techniques,
  openTechniques,
  onToggleTechnique,
  idPrefix = 'step',
}: StepTextProps) {
  return (
    <>
      {splitTokens(text).map((part, i) => {
        if (part.type === 'text') return part.value
        const key = `${part.type}-${part.id}-${i}`
        if (part.type === 'technique') {
          const technique = techniques?.get(part.id)
          const label = part.label ?? technique?.name ?? part.id
          if (!technique || !onToggleTechnique) return <span key={key}>{label}</span>
          const open = openTechniques?.has(part.id) ?? false
          return (
            <button
              key={key}
              type="button"
              aria-expanded={open}
              aria-controls={techniqueNoteId(idPrefix, part.id)}
              title={`${technique.name}: tap to ${open ? 'hide' : 'show'} how`}
              onClick={() => onToggleTechnique(part.id)}
              className={cn(
                'relative z-10 cursor-pointer rounded-sm underline decoration-primary/50 decoration-dotted decoration-2 underline-offset-[5px] outline-none transition-colors',
                'hover:text-foreground hover:decoration-primary hover:decoration-solid focus-visible:ring-3 focus-visible:ring-ring/50',
                open && 'decoration-primary/70',
              )}
            >
              {label}
              <ChevronDown
                className={cn(
                  'ml-0.5 inline size-3.5 align-[-0.12em] text-primary/70 transition-transform',
                  open && 'rotate-180',
                )}
                aria-hidden
              />
            </button>
          )
        }
        const line = lines.get(part.id)
        const ingredient = line && ingredients.get(line.ingredient)
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
