import { Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { useCatalog } from '@/lib/catalog'
import { ServingsStepper } from '@/lib/components/servings-stepper'
import { ShoppingList } from '@/lib/components/shopping-list'
import { usePlan } from '@/lib/plan'
import { applySwaps, buildShoppingList, groupByCategory } from '@/lib/recipe'
import { Button } from '@/lib/ui/button'
import { PageHeader } from '@/ux/page-header'
import { Section } from '@/ux/section'
import { EmptyState } from '@/ux/states'

/** The shopping list: chosen recipes with servings first, then the combined list grouped like a shop. */
export function ShoppingPage() {
  const { recipes, ingredients, catalog } = useCatalog()
  const { plan, remove, setServings, clear } = usePlan()
  const planned = plan.flatMap((p) => {
    const recipe = recipes.get(p.slug)
    return recipe ? [{ recipe: applySwaps(recipe, p.swaps ?? {}), servings: p.servings }] : []
  })
  const groups = groupByCategory(buildShoppingList(planned), ingredients, catalog.categories)

  if (planned.length === 0) {
    return (
      <>
        <PageHeader title="Shopping" />
        <EmptyState
          title="Nothing planned yet"
          description="Open a recipe and choose 'Add to shopping list' to build a combined list."
          action={
            <Button asChild variant="outline">
              <Link to="/">Browse recipes</Link>
            </Button>
          }
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Shopping"
        description="Quantities are combined across the recipes below."
        actions={
          <Button variant="outline" onClick={clear}>
            <Trash2 /> Clear all
          </Button>
        }
      />
      <div className="space-y-8">
        <Section id="planned" title="Cooking">
          <ul className="divide-y rounded-lg border">
            {planned.map(({ recipe, servings }) => (
              <li key={recipe.slug} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <Link to={`/recipes/${recipe.slug}`} className="font-medium hover:underline">
                  {recipe.title}
                </Link>
                <div className="flex items-center gap-3">
                  <ServingsStepper
                    value={servings}
                    onChange={(n) => setServings(recipe.slug, n)}
                    label={`Servings for ${recipe.title}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${recipe.title}`}
                    onClick={() => remove(recipe.slug)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Section>
        <Section id="list" title="To buy">
          <ShoppingList groups={groups} ingredients={ingredients} />
        </Section>
      </div>
    </>
  )
}
