import { z } from 'zod'
import { Recipe } from './recipe'
import { Ingredient, IngredientCategory, Kitchen, SwapRule, Tag, Tool, Vocab } from './taxonomy'

/** The built catalog: one JSON document the static site loads (`web/public/data/catalog.json`). */
export const Catalog = z
  .object({
    categories: z.array(IngredientCategory),
    tool_categories: z.array(Vocab),
    tag_domains: z.array(Vocab),
    swap_qualities: z.array(Vocab),
    recipe_statuses: z.array(Vocab),
    source_kinds: z.array(Vocab),
    ingredients: z.array(Ingredient),
    tools: z.array(Tool),
    tags: z.array(Tag),
    swaps: z.array(SwapRule),
    kitchen: Kitchen,
    recipes: z.array(Recipe),
  })
  .strict()
export type Catalog = z.infer<typeof Catalog>
