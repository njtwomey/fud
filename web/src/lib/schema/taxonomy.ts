import { z } from 'zod'
import { NutritionValues, Slug } from './common'

/**
 * One entry of a controlled list that lives in the data (ingredient categories, tag domains, tool categories, swap
 * qualities, recipe statuses, source kinds). Position in the file is the display order.
 */
export const Vocab = z
  .object({
    id: Slug,
    label: z.string().min(1),
    description: z.string().optional(),
  })
  .strict()
export type Vocab = z.infer<typeof Vocab>

/** Ingredient category, which doubles as a supermarket aisle: list order is the shop-walking order. */
export const IngredientCategory = Vocab.extend({
  spoon_measures: z
    .boolean()
    .default(false)
    .describe('Allow tsp and tbsp for ingredients in this category (herbs and spices).'),
}).strict()
export type Category = z.infer<typeof IngredientCategory>
/** A kind of tag (cuisine, course, diet, ...). */
export type TagDomainDef = Vocab
/** How well a swap works (close, fine, compromise). */
export type SwapQualityDef = Vocab

/** One vetted ingredient. Recipes may only reference ids defined here. */
export const Ingredient = z
  .object({
    id: Slug,
    name: z.string().min(1).describe("UK display name, singular or mass noun: 'garlic', 'basmati rice'."),
    plural: z.string().optional().describe("Plural display name for counted items without each_label: 'red peppers'."),
    category: Slug.describe('Category id from the `categories` list in ingredients.yaml.'),
    aliases: z.array(z.string()).default([]).describe('Other names, used by import and authoring lookups.'),
    each_label: z.string().optional().describe("Singular name of one item for 'each' quantities: 'clove', 'head'."),
    each_g: z.number().positive().optional().describe("Grams in one 'each'. Required to use unit 'each'."),
    density_g_per_ml: z.number().positive().optional().describe('Grams per ml. Needed to turn ml or l into grams.'),
    nutrition: NutritionValues.optional().describe('Per 100 g.'),
    nutrition_source: z.string().optional().describe("e.g. 'estimate' or a named database."),
    notes: z.string().optional(),
  })
  .strict()
export type Ingredient = z.infer<typeof Ingredient>

export const IngredientsFile = z
  .object({ categories: z.array(IngredientCategory), ingredients: z.array(Ingredient) })
  .strict()

/** Equipment. `substitutes` lists tools that can do the same job when this one is missing. */
export const Tool = z
  .object({
    id: Slug,
    name: z.string().min(1),
    category: Slug.describe('Category id from the `categories` list in tools.yaml.'),
    substitutes: z.array(Slug).default([]),
  })
  .strict()
export type Tool = z.infer<typeof Tool>

export const ToolsFile = z.object({ categories: z.array(Vocab), tools: z.array(Tool) }).strict()

/** A tag within a domain. */
export const Tag = z
  .object({ id: Slug, label: z.string().min(1), domain: Slug.describe('Domain id from `domains` in tags.yaml.') })
  .strict()
export type Tag = z.infer<typeof Tag>

export const TagsFile = z.object({ domains: z.array(Vocab), tags: z.array(Tag) }).strict()

/** Use `ingredient` instead. `ratio` multiplies the original amount. */
export const SwapOption = z
  .object({
    ingredient: Slug,
    ratio: z.number().positive().default(1),
    quality: Slug.default('fine').describe('Quality id from `qualities` in swaps.yaml.'),
    note: z.string().optional(),
  })
  .strict()
export type SwapOption = z.infer<typeof SwapOption>

/** A general-purpose substitution list for one ingredient. */
export const SwapRule = z.object({ ingredient: Slug, alternatives: z.array(SwapOption).min(1) }).strict()
export type SwapRule = z.infer<typeof SwapRule>

export const SwapsFile = z.object({ qualities: z.array(Vocab), swaps: z.array(SwapRule) }).strict()

/** Recipe statuses and where recipes come from. */
export const RecipeOptionsFile = z.object({ statuses: z.array(Vocab), source_kinds: z.array(Vocab) }).strict()

/** What the cook actually has. Drives missing-equipment hints and tool alternatives. */
export const Kitchen = z
  .object({
    oven: z.enum(['fan', 'conventional']).default('fan'),
    hob: z.string().optional().describe("e.g. 'gas', 'induction'."),
    tools: z.array(Slug).default([]).describe('Tool ids owned.'),
    notes: z.array(z.string()).default([]),
  })
  .strict()
export type Kitchen = z.infer<typeof Kitchen>
