import { cn } from 'cn'
import { ArrowLeftRight } from 'lucide-react'
import { useState } from 'react'
import { type ChosenSwaps, swapOptions } from '../recipe/swaps'
import { describeQuantity } from '../recipe/units'
import type { Ingredient, IngredientLine, Recipe, SwapOption, SwapRule, Vocab } from '../schema'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

interface IngredientPanelProps {
  /** The recipe as written. Swaps are shown on top of it and reported through `onSwap`. */
  recipe: Recipe
  /** Servings divided by the recipe's base servings. */
  factor: number
  ingredients: ReadonlyMap<string, Ingredient>
  swaps: readonly SwapRule[]
  /** Swap quality labels from the data, e.g. close, fine, compromise. */
  qualities: readonly Vocab[]
  chosen: ChosenSwaps
  /** Choose a swap for a line, or `null` to go back to the ingredient as written. */
  onSwap: (lineId: string, option: SwapOption | null) => void
  /** Ingredient line ids to emphasise, e.g. those used by the step being read. */
  highlighted?: ReadonlySet<string>
}

interface SwapMenuProps {
  line: IngredientLine
  factor: number
  ingredients: ReadonlyMap<string, Ingredient>
  options: SwapOption[]
  qualities: readonly Vocab[]
  selected: SwapOption | undefined
  onPick: (option: SwapOption | null) => void
}

const choiceClass =
  'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors hover:bg-accent aria-pressed:border-ring aria-pressed:bg-accent'

/** The choices for one line: as written, or any swap. Picking one rewrites the recipe. */
function SwapMenu({ line, factor, ingredients, options, qualities, selected, onPick }: SwapMenuProps) {
  const original = ingredients.get(line.ingredient)
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Use instead of {original?.name}</p>
      {original ? (
        <button type="button" aria-pressed={!selected} className={choiceClass} onClick={() => onPick(null)}>
          <span className="font-medium">{describeQuantity(line.quantity, factor, original)}</span>
          <span className="block text-muted-foreground">As written</span>
        </button>
      ) : null}
      {options.map((option) => {
        const target = ingredients.get(option.ingredient)
        if (!target) return null
        const quantity = line.quantity && { ...line.quantity, amount: line.quantity.amount * option.ratio }
        return (
          <button
            type="button"
            key={option.ingredient}
            aria-pressed={selected?.ingredient === option.ingredient}
            className={choiceClass}
            onClick={() => onPick(option)}
          >
            <span className="font-medium">{describeQuantity(quantity, factor, target)}</span>
            <span className="block text-muted-foreground">
              {qualities.find((q) => q.id === option.quality)?.label ?? option.quality}
              {option.note ? `. ${option.note}` : ''}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Ingredients grouped by recipe phase and scaled to the chosen servings. Each line says only what the ingredient is
 * (preparation belongs in the method). Lines can be ticked off, and where swaps exist a button offers them: picking
 * one replaces the ingredient and amount here, and everywhere the recipe is derived from.
 */
export function IngredientPanel({
  recipe,
  factor,
  ingredients,
  swaps,
  qualities,
  chosen,
  onSwap,
  highlighted,
}: IngredientPanelProps) {
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set())
  const [openLine, setOpenLine] = useState<string | null>(null)
  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  return (
    <div className="space-y-6">
      {recipe.components
        .filter((c) => c.ingredients.length > 0)
        .map((component) => (
          <section key={component.id} aria-labelledby={`ing-${component.id}`}>
            <h3
              id={`ing-${component.id}`}
              className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase"
            >
              {component.title}
            </h3>
            <ul className="space-y-1">
              {component.ingredients.map((line) => {
                const swap = chosen[line.id]
                const original = ingredients.get(line.ingredient)
                const current = ingredients.get(swap?.ingredient ?? line.ingredient)
                if (!original || !current) return null
                const quantity = line.quantity && {
                  ...line.quantity,
                  amount: line.quantity.amount * (swap?.ratio ?? 1),
                }
                const options = swapOptions(line, swaps)
                const done = checked.has(line.id)
                return (
                  <li
                    key={line.id}
                    data-highlighted={highlighted?.has(line.id) || undefined}
                    className="flex items-start gap-2 rounded-md px-2 py-1 transition-colors data-[highlighted]:bg-accent"
                  >
                    <Checkbox
                      id={`line-${line.id}`}
                      className="mt-1"
                      checked={done}
                      onCheckedChange={() => toggle(line.id)}
                    />
                    <label
                      htmlFor={`line-${line.id}`}
                      className={cn('flex-1 text-sm', done && 'text-muted-foreground line-through')}
                    >
                      <span className="font-medium">{describeQuantity(quantity, factor, current)}</span>
                      {swap ? (
                        <span className="block text-xs text-muted-foreground">instead of {original.name}</span>
                      ) : null}
                      {line.note ? <span className="text-muted-foreground"> ({line.note})</span> : null}
                      {line.optional ? (
                        <Badge variant="secondary" className="ml-2">
                          optional
                        </Badge>
                      ) : null}
                    </label>
                    {options.length > 0 ? (
                      <Popover open={openLine === line.id} onOpenChange={(open) => setOpenLine(open ? line.id : null)}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant={swap ? 'secondary' : 'ghost'}
                            size="icon-sm"
                            aria-label={`Swaps for ${current.name}`}
                          >
                            <ArrowLeftRight />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end">
                          <SwapMenu
                            line={line}
                            factor={factor}
                            ingredients={ingredients}
                            options={options}
                            qualities={qualities}
                            selected={swap}
                            onPick={(option) => {
                              onSwap(line.id, option)
                              setOpenLine(null)
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
    </div>
  )
}
