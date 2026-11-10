import { Catalog, type Recipe } from '../schema'

/** A small but complete catalog for tests: two components, parallel and dependent steps, swaps and nutrition. */
export function makeCatalog(): Catalog {
  return Catalog.parse({
    categories: [
      { id: 'produce', label: 'Fruit and veg' },
      { id: 'grains-pasta', label: 'Rice, grains and pasta' },
      { id: 'spices', label: 'Spices', spoon_measures: true },
      { id: 'oils-fats', label: 'Oils and fats' },
    ],
    tool_categories: [
      { id: 'cutting', label: 'Cutting' },
      { id: 'vessel', label: 'Pots and pans' },
      { id: 'appliance', label: 'Appliances' },
    ],
    tag_domains: [{ id: 'course', label: 'Course' }],
    swap_qualities: [
      { id: 'close', label: 'Close match' },
      { id: 'fine', label: 'Works well' },
      { id: 'compromise', label: 'A compromise' },
    ],
    recipe_statuses: [
      { id: 'draft', label: 'Draft' },
      { id: 'tested', label: 'Tested' },
    ],
    source_kinds: [{ id: 'original', label: 'Original' }],
    ingredients: [
      {
        id: 'garlic',
        name: 'garlic',
        category: 'produce',
        each_label: 'clove',
        each_g: 5,
        nutrition: { kcal: 150 },
      },
      {
        id: 'red-pepper',
        name: 'red pepper',
        plural: 'red peppers',
        category: 'produce',
        each_g: 160,
        nutrition: { kcal: 30 },
      },
      { id: 'rice', name: 'basmati rice', category: 'grains-pasta', nutrition: { kcal: 350, protein_g: 8 } },
      { id: 'jasmine-rice', name: 'jasmine rice', category: 'grains-pasta', nutrition: { kcal: 350 } },
      { id: 'cumin', name: 'ground cumin', category: 'spices', density_g_per_ml: 0.45, nutrition: { kcal: 375 } },
      { id: 'oil', name: 'olive oil', category: 'oils-fats', density_g_per_ml: 0.9, nutrition: { kcal: 900 } },
    ],
    tools: [
      { id: 'knife', name: "chef's knife", category: 'cutting' },
      { id: 'saucepan', name: 'saucepan', category: 'vessel', substitutes: ['rice-cooker'] },
      { id: 'rice-cooker', name: 'rice cooker', category: 'appliance' },
    ],
    tags: [{ id: 'dinner', label: 'Dinner', domain: 'course' }],
    swaps: [
      {
        ingredient: 'rice',
        alternatives: [{ ingredient: 'jasmine-rice', ratio: 1, quality: 'fine', note: 'Stickier.' }],
      },
    ],
    kitchen: { oven: 'fan', tools: ['knife', 'rice-cooker'], notes: [] },
    recipes: [makeRecipeInput()],
  })
}

export function makeRecipeInput(): unknown {
  return {
    slug: 'garlic-rice',
    title: 'Garlic Rice',
    summary: 'Rice with garlic.',
    date: '2026-01-01',
    servings: 2,
    tags: ['dinner'],
    components: [
      {
        id: 'base',
        title: 'For the rice',
        ingredients: [
          { id: 'rice', ingredient: 'rice', quantity: { amount: 200, unit: 'g' } },
          { id: 'garlic', ingredient: 'garlic', quantity: { amount: 2, unit: 'each' } },
          { id: 'oil', ingredient: 'oil', quantity: { amount: 20, unit: 'ml' }, optional: false },
          { id: 'pepper', ingredient: 'red-pepper', quantity: { amount: 1, unit: 'each' }, optional: true },
        ],
      },
    ],
    steps: [
      {
        id: 'slice',
        title: 'Slice the garlic',
        component: 'base',
        kind: 'prep',
        text: 'Slice {garlic}.',
        active_min: 5,
        after: [],
      },
      {
        id: 'boil',
        title: 'Cook the rice',
        component: 'base',
        kind: 'cook',
        text: 'Cook {rice}.',
        cue: 'The grains are tender.',
        active_min: 2,
        passive_min: 12,
        after: [],
        tools: [{ tool: 'saucepan', alternatives: ['rice-cooker'] }],
      },
      {
        id: 'fry',
        title: 'Fry the garlic',
        component: 'base',
        kind: 'cook',
        text: 'Fry {garlic} in {oil}.',
        active_min: 3,
        cue: 'Golden.',
        after: ['slice'],
      },
      {
        id: 'serve',
        title: 'Serve',
        component: 'base',
        kind: 'serve',
        text: 'Combine and serve.',
        active_min: 1,
        after: ['boil', 'fry'],
      },
    ],
  }
}

export function makeRecipe(): Recipe {
  return makeCatalog().recipes[0] as Recipe
}
