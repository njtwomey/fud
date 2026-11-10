import { Check, Clock, Layers, ListOrdered, Scissors, ShoppingBasket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router'
import { imageUrl, useCatalog } from '@/lib/catalog'
import { CollapsibleSection } from '@/lib/components/collapsible-section'
import { IngredientPanel } from '@/lib/components/ingredient-panel'
import { NutritionTable } from '@/lib/components/nutrition-table'
import { ScrollPanel } from '@/lib/components/scroll-panel'
import { ServingsStepper } from '@/lib/components/servings-stepper'
import { StepCard } from '@/lib/components/step-card'
import { Timeline } from '@/lib/components/timeline'
import { ToolList } from '@/lib/components/tool-list'
import { type ViewOption, ViewSwitcher } from '@/lib/components/view-switcher'
import { ZoomableImage } from '@/lib/components/zoomable-image'
import { usePlan } from '@/lib/plan'
import {
  activeMinutes,
  applySwaps,
  type ChosenSwaps,
  computeSchedule,
  estimateNutrition,
  formatDuration,
  groupSteps,
  type MethodView,
  stepLineIds,
  totalMinutes,
} from '@/lib/recipe'
import type { Recipe, SwapOption } from '@/lib/schema'
import { Badge } from '@/lib/ui/badge'
import { Button } from '@/lib/ui/button'
import { Input } from '@/lib/ui/input'
import { Label } from '@/lib/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/ui/tabs'
import { ErrorState } from '@/ux/states'

const VIEWS: ViewOption<MethodView>[] = [
  { value: 'written', label: 'As written', icon: <ListOrdered /> },
  { value: 'prep-first', label: 'Prep first', icon: <Scissors /> },
  { value: 'by-phase', label: 'By phase', icon: <Layers /> },
]

/**
 * One recipe. On desktop the page fills the viewport and ingredients, method and the details column (equipment,
 * nutrition, notes) each scroll on their own, so ingredients stay in view while reading the method.
 */
export function RecipePage() {
  const { slug } = useParams()
  const { recipes } = useCatalog()
  const recipe = slug ? recipes.get(slug) : undefined
  if (!recipe)
    return <ErrorState title="Recipe not found" description="Check the link, or pick a recipe from the library." />
  return <RecipeView key={recipe.slug} recipe={recipe} />
}

function RecipeView({ recipe }: { recipe: Recipe }) {
  const { catalog, ingredients, tools, tags } = useCatalog()
  const plan = usePlan()
  const planItem = plan.get(recipe.slug)
  const planned = planItem !== undefined
  const [servings, setServings] = useState(planItem?.servings ?? recipe.servings)
  const [chosen, setChosen] = useState<ChosenSwaps>(planItem?.swaps ?? {})
  const [tab, setTab] = useState('method')
  const [view, setView] = useState<MethodView>('written')
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [done, setDone] = useState<ReadonlySet<string>>(new Set())
  const [serveAt, setServeAt] = useState('')

  // Keep the shopping list in step with what is chosen here once the recipe is on it.
  const { add } = plan
  useEffect(() => {
    if (planned) add({ slug: recipe.slug, servings, swaps: chosen })
  }, [planned, add, recipe.slug, servings, chosen])

  // Everything below is derived from the recipe as it will be cooked, with the chosen swaps applied.
  const cooked = useMemo(() => applySwaps(recipe, chosen), [recipe, chosen])
  const factor = servings / recipe.servings
  const lines = useMemo(() => new Map(cooked.components.flatMap((c) => c.ingredients).map((l) => [l.id, l])), [cooked])
  const schedule = useMemo(() => computeSchedule(recipe), [recipe])
  const nutrition = useMemo(() => estimateNutrition(cooked, ingredients), [cooked, ingredients])
  const groups = useMemo(() => groupSteps(recipe, view), [recipe, view])
  const owned = useMemo(() => new Set(catalog.kitchen.tools), [catalog.kitchen.tools])
  const toolIds = useMemo(() => [...new Set(recipe.steps.flatMap((s) => s.tools.map((t) => t.tool)))], [recipe])
  const step = recipe.steps.find((s) => s.id === activeStep)
  const highlightedLines = useMemo(() => (step ? stepLineIds(step) : undefined), [step])
  const highlightedTools = useMemo(() => (step ? new Set(step.tools.map((t) => t.tool)) : undefined), [step])
  const hero = recipe.images[0]
  const ingredientNames = new Map([...ingredients].map(([id, i]) => [id, i.name]))

  const toggleDone = (id: string) =>
    setDone((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })
  const chooseSwap = (lineId: string, option: SwapOption | null) =>
    setChosen((prev) => {
      const next = { ...prev }
      if (option) next[lineId] = option
      else delete next[lineId]
      return next
    })

  let counter = 0
  return (
    // 5.5rem = nav bar (3.5rem) + the shell's vertical padding (2rem).
    <div className="flex flex-col gap-3 lg:h-[calc(100dvh-5.5rem)]">
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-xl font-semibold tracking-tight">{recipe.title}</h1>
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-4" aria-hidden />
          {formatDuration(totalMinutes(schedule))} total · {formatDuration(activeMinutes(recipe))} hands-on
        </span>
        <Badge variant="outline">
          v{recipe.version} · {catalog.recipe_statuses.find((x) => x.id === recipe.status)?.label ?? recipe.status}
        </Badge>
        {recipe.tags.map((t) => (
          <Badge key={t} variant="secondary">
            {tags.get(t)?.label ?? t}
          </Badge>
        ))}
        <Button
          size="sm"
          className="ml-auto"
          variant={planned ? 'secondary' : 'default'}
          onClick={() =>
            planned ? plan.remove(recipe.slug) : plan.add({ slug: recipe.slug, servings, swaps: chosen })
          }
        >
          {planned ? <Check /> : <ShoppingBasket />}
          {planned ? 'On shopping list' : 'Add to shopping list'}
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[21rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)_22rem]">
        <ScrollPanel
          title="Ingredients"
          actions={<ServingsStepper value={servings} onChange={setServings} />}
          className="max-lg:order-1"
        >
          <IngredientPanel
            recipe={recipe}
            factor={factor}
            ingredients={ingredients}
            swaps={catalog.swaps}
            qualities={catalog.swap_qualities}
            chosen={chosen}
            onSwap={chooseSwap}
            highlighted={highlightedLines}
          />
        </ScrollPanel>

        <Tabs value={tab} onValueChange={setTab} className="contents">
          <ScrollPanel
            title="Method and timeline"
            hideTitle
            className="max-lg:order-2"
            actions={
              <>
                <TabsList>
                  <TabsTrigger value="method">Method</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>
                {tab === 'method' ? (
                  <ViewSwitcher value={view} onChange={setView} options={VIEWS} label="Method view" />
                ) : (
                  <span className="flex items-center gap-2">
                    <Label htmlFor="serve-at">Serve at</Label>
                    <Input
                      id="serve-at"
                      type="time"
                      className="w-32"
                      value={serveAt}
                      onChange={(e) => setServeAt(e.target.value)}
                    />
                  </span>
                )}
              </>
            }
          >
            <TabsContent value="method" className="space-y-8">
              {groups.map((group) => (
                <div key={group.key}>
                  {group.title ? (
                    <h3 className="mb-1 px-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                      {group.title}
                    </h3>
                  ) : null}
                  <ol className="divide-y divide-border/60">
                    {group.steps.map((s) => {
                      counter += 1
                      return (
                        <StepCard
                          key={s.id}
                          step={s}
                          number={counter}
                          lines={lines}
                          ingredients={ingredients}
                          factor={factor}
                          slug={recipe.slug}
                          imageSrc={imageUrl}
                          done={done.has(s.id)}
                          active={activeStep === s.id}
                          onToggleDone={toggleDone}
                          onSelect={(id) => setActiveStep((prev) => (prev === id ? null : id))}
                        />
                      )
                    })}
                  </ol>
                </div>
              ))}
            </TabsContent>
            <TabsContent value="timeline">
              <Timeline recipe={recipe} schedule={schedule} serveAt={serveAt || undefined} />
            </TabsContent>
          </ScrollPanel>
        </Tabs>

        <ScrollPanel title="Details" className="max-lg:order-3 lg:col-span-2 xl:col-span-1">
          {hero || recipe.summary ? (
            <CollapsibleSection id="details-about" title="About">
              <div className="space-y-3">
                {hero ? (
                  <ZoomableImage
                    src={imageUrl(recipe.slug, hero.file)}
                    alt={hero.alt}
                    caption={hero.caption}
                    className="max-h-48"
                  />
                ) : null}
                {recipe.summary ? <p className="text-sm leading-6 text-muted-foreground">{recipe.summary}</p> : null}
              </div>
            </CollapsibleSection>
          ) : null}
          <CollapsibleSection id="details-equipment" title="Equipment">
            <ToolList toolIds={toolIds} tools={tools} owned={owned} highlighted={highlightedTools} />
          </CollapsibleSection>
          {nutrition ? (
            <CollapsibleSection id="details-nutrition" title="Per serving">
              <NutritionTable estimate={nutrition} names={ingredientNames} />
            </CollapsibleSection>
          ) : null}
          <CollapsibleSection id="details-notes" title="Notes">
            <div className="space-y-4 text-sm leading-6">
              {recipe.notes.length > 0 ? (
                <ul className="space-y-3">
                  {recipe.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No notes yet.</p>
              )}
              {recipe.open_questions.length > 0 ? (
                <div>
                  <h4 className="mb-2 font-semibold">Open questions</h4>
                  <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                    {recipe.open_questions.map((q) => (
                      <li key={q}>{q}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </CollapsibleSection>
        </ScrollPanel>
      </div>
    </div>
  )
}
