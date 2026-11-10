---

name: recipe-nutrition
description: Fill in or check per-100 g nutrition, density and each-weights for ingredients in data/ingredients.yaml so recipes get nutrition estimates. Use when doctor reports missing nutrition or coverage, or after adding ingredients.
---

# Estimate ingredient nutrition

Recipe nutrition is computed at runtime from the taxonomy: each ingredient has per-100 g `nutrition`, and recipe
lines are converted to grams using `each_g` (counted items) and `density_g_per_ml` (volumes). So the work here is
making the **ingredient entries** right. Never write nutrition into a recipe file.

## Steps

1. Run `make doctor`. Warnings name ingredients with no nutrition, volume lines with no density, and recipes whose
   nutrition covers under 90% of ingredient weight.
2. For each ingredient to fill, find per-100 g values, best source first:
   1. UK composition data (McCance and Widdowson, CoFID) or the packet label for a branded product the user names.
   2. USDA FoodData Central.
   3. A well-reasoned estimate from a close ingredient.
      Use WebSearch or WebFetch for 1 and 2 when you are not certain; do not rely on memory for unusual ingredients.
3. Write `nutrition` with whichever of `kcal`, `protein_g`, `fat_g`, `saturates_g`, `carbs_g`, `sugars_g`,
   `fibre_g`, `salt_g` you have. Leave a field out rather than guessing it. Salt is salt, not sodium
   (salt = sodium x 2.5).
4. Set `nutrition_source` honestly: the database or product name, or `estimate`. Dry rice and pasta are listed
   dry (per 100 g uncooked) because recipes list dry weight.
5. Add `density_g_per_ml` for liquids and fine powders that recipes measure in ml or spoons (oils, soy sauce, honey,
   milk, and every spice used in teaspoons: a level teaspoon of ground spice is roughly 2 to 3 g, so about 0.4 to
   0.6 g per ml). Add `each_g` and `each_label` for counted items (egg, clove, onion).
6. Run `make format` and `make doctor`. Report coverage for the affected recipes and anything still missing.

The figures are estimates for planning, not medical advice. Say so if the user relies on them for dietary needs.
