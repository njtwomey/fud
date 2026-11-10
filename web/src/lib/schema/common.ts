import { z } from 'zod'

/** Lowercase kebab-case id. Used for recipe, ingredient, tool, tag, component, line and step ids. */
export const Slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase kebab-case')
  .max(80)
export type Slug = z.infer<typeof Slug>

/**
 * The only units allowed anywhere: metric weights and volumes, plus `tsp` and `tbsp` for herbs and spices. No cups,
 * ounces or pounds: convert to g or ml when authoring.
 * `each` is a count of whole items (2 eggs, 3 cloves) and needs the ingredient to declare `each_g`.
 * `tsp` and `tbsp` are only allowed for ingredients whose category sets `spoon_measures` in the data, and need
 * `density_g_per_ml` for nutrition (1 tsp = 5 ml, 1 tbsp = 15 ml).
 */
export const Unit = z.enum(['g', 'kg', 'ml', 'l', 'each', 'tsp', 'tbsp'])
export type Unit = z.infer<typeof Unit>

/** A photo stored under `recipes/<slug>/images/`. */
export const Image = z
  .object({
    file: z.string().min(1).describe("File name inside the recipe's images/ folder."),
    alt: z.string().min(1).describe('Alt text describing what the photo shows.'),
    caption: z.string().optional(),
  })
  .strict()
export type Image = z.infer<typeof Image>

/** Nutrition figures. Per 100 g in the taxonomy, per serving when computed for a recipe. Missing means unknown. */
export const NutritionValues = z
  .object({
    kcal: z.number().nonnegative().optional(),
    protein_g: z.number().nonnegative().optional(),
    fat_g: z.number().nonnegative().optional(),
    saturates_g: z.number().nonnegative().optional(),
    carbs_g: z.number().nonnegative().optional(),
    sugars_g: z.number().nonnegative().optional(),
    fibre_g: z.number().nonnegative().optional(),
    salt_g: z.number().nonnegative().optional(),
  })
  .strict()
export type NutritionValues = z.infer<typeof NutritionValues>

export const NUTRITION_FIELDS = [
  'kcal',
  'protein_g',
  'fat_g',
  'saturates_g',
  'carbs_g',
  'sugars_g',
  'fibre_g',
  'salt_g',
] as const satisfies readonly (keyof NutritionValues)[]
