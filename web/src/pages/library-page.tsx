import { Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { imageUrl, useCatalog } from '@/lib/catalog'
import { RecipeCard } from '@/lib/components/recipe-card'
import { TagFilter } from '@/lib/components/tag-filter'
import { computeSchedule, totalMinutes } from '@/lib/recipe'
import { Badge } from '@/lib/ui/badge'
import { Button } from '@/lib/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/lib/ui/collapsible'
import { Input } from '@/lib/ui/input'
import { Section } from '@/ux/section'
import { EmptyState } from '@/ux/states'

/** What to cook: search first (with the tag filters a button away), then the matching recipes. */
export function LibraryPage() {
  const { catalog, ingredients, tags } = useCatalog()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [filtersOpen, setFiltersOpen] = useState(false)

  const toggleTag = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return catalog.recipes.filter((recipe) => {
      if (![...selected].every((t) => recipe.tags.includes(t))) return false
      if (!q) return true
      const names = recipe.components.flatMap((c) =>
        c.ingredients.map((l) => ingredients.get(l.ingredient)?.name ?? ''),
      )
      return [recipe.title, recipe.summary ?? '', ...names].some((text) => text.toLowerCase().includes(q))
    })
  }, [catalog.recipes, ingredients, query, selected])

  const usedTags = catalog.tags.filter((t) => catalog.recipes.some((r) => r.tags.includes(t.id)))

  return (
    <>
      <h1 className="sr-only">Recipes</h1>
      <div className="space-y-6">
        <Section id="find" title="Find a recipe">
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="space-y-4">
            <div className="flex max-w-xl items-center gap-2">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  aria-label="Search recipes"
                  placeholder="Search by name or ingredient"
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <CollapsibleTrigger asChild>
                <Button variant={filtersOpen ? 'secondary' : 'outline'}>
                  <SlidersHorizontal />
                  Filters
                  {selected.size > 0 ? (
                    <Badge aria-label={`${selected.size} active`} className="ml-1">
                      {selected.size}
                    </Badge>
                  ) : null}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <TagFilter domains={catalog.tag_domains} tags={usedTags} selected={selected} onToggle={toggleTag} />
            </CollapsibleContent>
          </Collapsible>
        </Section>
        <Section id="results" title={`${results.length} ${results.length === 1 ? 'recipe' : 'recipes'}`}>
          {results.length === 0 ? (
            <EmptyState
              title={catalog.recipes.length === 0 ? 'No recipes yet' : 'Nothing matches'}
              description={
                catalog.recipes.length === 0
                  ? 'Add a recipe folder under recipes/ and run make data.'
                  : 'Try removing a tag or searching for something else.'
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {results.map((recipe) => {
                const hero = recipe.images[0]
                return (
                  <RecipeCard
                    key={recipe.slug}
                    to={`/recipes/${recipe.slug}`}
                    title={recipe.title}
                    summary={recipe.summary}
                    imageSrc={hero ? imageUrl(recipe.slug, hero.file) : undefined}
                    imageAlt={hero?.alt}
                    totalMin={totalMinutes(computeSchedule(recipe))}
                    servings={recipe.servings}
                    tags={recipe.tags.flatMap((t) => tags.get(t) ?? [])}
                  />
                )
              })}
            </div>
          )}
        </Section>
      </div>
    </>
  )
}
