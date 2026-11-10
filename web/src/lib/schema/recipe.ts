import { z } from 'zod'
import { Image, Slug, Unit } from './common'
import { SwapOption } from './taxonomy'

/** prep = mise en place; cook = hands-on heat or assembly; wait = passive (rest, marinate, chill, unattended bake). */
export const StepKind = z.enum(['prep', 'cook', 'wait', 'serve'])
export type StepKind = z.infer<typeof StepKind>

export const Heat = z.enum(['low', 'medium-low', 'medium', 'medium-high', 'high'])
export type Heat = z.infer<typeof Heat>

export const Quantity = z.object({ amount: z.number().positive(), unit: Unit }).strict()
export type Quantity = z.infer<typeof Quantity>

export const IngredientLine = z
  .object({
    id: Slug.describe('Unique within the recipe. Steps refer to it as {id} in text or in `uses`.'),
    ingredient: Slug.describe('Taxonomy ingredient id.'),
    quantity: Quantity.optional().describe("Omit for 'to taste' or 'to coat'."),
    note: z.string().optional().describe("Short qualifier such as 'to coat' or 'large'. Never how it is prepared."),
    optional: z.boolean().default(false),
    swaps: z.array(SwapOption).default([]).describe('Recipe-specific swaps, shown before the global ones.'),
  })
  .strict()
export type IngredientLine = z.infer<typeof IngredientLine>

export const Component = z
  .object({
    id: Slug,
    title: z.string().min(1).describe("'For the sauce', 'To finish'."),
    ingredients: z.array(IngredientLine).default([]),
  })
  .strict()
export type Component = z.infer<typeof Component>

export const Temperature = z
  .object({
    celsius: z.number().int().positive().max(300),
    mode: z.enum(['fan', 'conventional', 'grill']).default('fan'),
  })
  .strict()
export type Temperature = z.infer<typeof Temperature>

export const StepTool = z
  .object({
    tool: Slug,
    alternatives: z.array(Slug).default([]).describe('Other tools that also work for this step.'),
    note: z.string().optional(),
  })
  .strict()
export type StepTool = z.infer<typeof StepTool>

export const Step = z
  .object({
    id: Slug,
    title: z.string().min(1).describe("Short imperative headline, 2 to 5 words: 'Roast the vegetables'."),
    component: Slug,
    kind: StepKind,
    text: z
      .string()
      .min(1)
      .describe(
        'What to do, in a sentence or two. {line-id} inserts the scaled quantity and name; {line-id:name} inserts ' +
          'just the name. Always use tokens for ingredients so swaps flow through.',
      ),
    substeps: z.array(z.string()).default([]).describe('The detailed actions within this stage, in order.'),
    cue: z.string().optional().describe('Sensory doneness cue to pair with any timing.'),
    active_min: z.number().int().nonnegative().default(0).describe('Minutes of hands-on attention.'),
    passive_min: z.number().int().nonnegative().default(0).describe('Minutes that pass without attention.'),
    heat: Heat.optional(),
    temperature: Temperature.optional(),
    tools: z.array(StepTool).default([]),
    uses: z.array(Slug).default([]).describe('Ingredient line ids used, beyond {tokens} in text.'),
    after: z
      .array(Slug)
      .optional()
      .describe(
        'Step ids that must finish first. Omitted: follows the previous step in its component ' +
          '(or starts at 0 if first). Empty list: starts at 0 regardless.',
      ),
    make_ahead: z.boolean().default(false).describe('Can be done earlier, e.g. the day before.'),
    photos: z.array(Image).default([]),
  })
  .strict()
export type Step = z.infer<typeof Step>

export const Source = z
  .object({
    kind: Slug.describe('Source kind id from `source_kinds` in recipe-options.yaml.'),
    title: z.string().optional(),
    url: z.string().optional(),
    note: z.string().optional(),
  })
  .strict()
export type Source = z.infer<typeof Source>

function duplicates(ids: string[]): string[] {
  return [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))]
}

/**
 * The recipe file format (`recipes/<slug>/recipe.yaml`).
 *
 * A recipe is a set of components (phases such as 'sauce' or 'base') holding ingredient lines, plus a flat list of
 * steps. Every step belongs to a component and has a kind. The views (as written, prep first, by phase, timeline)
 * are all derived from those two facts and from `after` dependencies, so nothing is stored twice.
 */
export const Recipe = z
  .object({
    slug: Slug.describe('Must equal the folder name.'),
    title: z.string().min(1),
    summary: z.string().optional(),
    version: z.number().int().min(1).default(1),
    date: z.iso.date(),
    status: Slug.default('draft').describe('Status id from `statuses` in recipe-options.yaml.'),
    source: Source.optional(),
    servings: z.number().int().positive().describe('Base portions the quantities are written for.'),
    tags: z.array(Slug).default([]),
    images: z.array(Image).default([]).describe('First image is the hero.'),
    components: z.array(Component).min(1),
    steps: z.array(Step).min(1),
    notes: z.array(z.string()).default([]).describe('Make-ahead, storage, optional suggestions.'),
    open_questions: z.array(z.string()).default([]).describe('Variables not yet tested.'),
  })
  .strict()
  .superRefine((recipe, ctx) => {
    const groups: [string, string[]][] = [
      ['component', recipe.components.map((c) => c.id)],
      ['ingredient line', recipe.components.flatMap((c) => c.ingredients.map((l) => l.id))],
      ['step', recipe.steps.map((s) => s.id)],
    ]
    for (const [label, ids] of groups) {
      for (const dup of duplicates(ids)) ctx.addIssue({ code: 'custom', message: `duplicate ${label} id '${dup}'` })
    }
  })
export type Recipe = z.infer<typeof Recipe>
