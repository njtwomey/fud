import { useState } from 'react'
import type { ShoppingItem } from '../recipe/shopping'
import { describeQuantity } from '../recipe/units'
import type { Ingredient, Vocab } from '../schema'
import { Checkbox } from '../ui/checkbox'

interface ShoppingListProps {
  groups: readonly (readonly [category: Vocab, items: ShoppingItem[]])[]
  ingredients: ReadonlyMap<string, Ingredient>
}

/** Shopping items grouped by category (as in a shop), with tick-off boxes. */
export function ShoppingList({ groups, ingredients }: ShoppingListProps) {
  const [ticked, setTicked] = useState<ReadonlySet<string>>(new Set())
  const toggle = (key: string) =>
    setTicked((prev) => {
      const next = new Set(prev)
      if (!next.delete(key)) next.add(key)
      return next
    })

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {groups.map(([category, items]) => (
        <section key={category.id} aria-labelledby={`shop-${category.id}`}>
          <h3
            id={`shop-${category.id}`}
            className="mb-2 text-sm font-semibold tracking-wide text-muted-foreground uppercase"
          >
            {category.label}
          </h3>
          <ul className="space-y-1">
            {items.map((item) => {
              const ingredient = ingredients.get(item.ingredient)
              const key = `${item.ingredient}|${item.unit}|${item.unquantified}`
              const done = ticked.has(key)
              return (
                <li key={key} className="flex items-center gap-2">
                  <Checkbox id={`shop-${key}`} checked={done} onCheckedChange={() => toggle(key)} />
                  <label
                    htmlFor={`shop-${key}`}
                    className={`text-sm ${done ? 'text-muted-foreground line-through' : ''}`}
                  >
                    {!ingredient || item.unquantified ? (
                      <span>{ingredient?.name ?? item.ingredient}</span>
                    ) : (
                      <span className="font-medium">
                        {describeQuantity({ amount: item.amount, unit: item.unit }, 1, ingredient)}
                      </span>
                    )}
                  </label>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
