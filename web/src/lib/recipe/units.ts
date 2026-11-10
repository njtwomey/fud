import type { Ingredient, Quantity } from '../schema'

export type BaseUnit = 'g' | 'ml' | 'each' | 'tsp'

export interface BaseQuantity {
  amount: number
  unit: BaseUnit
}

/** Normalise kg to g and l to ml so quantities can be summed. */
export function toBase(q: Quantity): BaseQuantity {
  switch (q.unit) {
    case 'kg':
      return { amount: q.amount * 1000, unit: 'g' }
    case 'l':
      return { amount: q.amount * 1000, unit: 'ml' }
    case 'tbsp':
      return { amount: q.amount * 3, unit: 'tsp' }
    default:
      return { amount: q.amount, unit: q.unit }
  }
}

/** Mass in grams, or undefined if it cannot be known (ml without density, each without each_g). */
export function toGrams(q: Quantity, ingredient: Ingredient): number | undefined {
  const base = toBase(q)
  if (base.unit === 'g') return base.amount
  if (base.unit === 'ml') return ingredient.density_g_per_ml ? base.amount * ingredient.density_g_per_ml : undefined
  if (base.unit === 'tsp')
    return ingredient.density_g_per_ml ? base.amount * 5 * ingredient.density_g_per_ml : undefined
  return ingredient.each_g ? base.amount * ingredient.each_g : undefined
}

function trim(n: number, decimals: number): string {
  return Number(n.toFixed(decimals)).toString()
}

/** Round to something a person would measure: whole grams above 10, halves for counts. */
function niceNumber(n: number, unit: BaseUnit): string {
  if (unit === 'each') return halves(n)
  if (unit === 'tsp') return spoonNumber(n)
  if (n >= 100) return trim(Math.round(n / 5) * 5, 0)
  if (n >= 10) return trim(n, 0)
  return trim(n, 1)
}

/** Counts in halves: ½, 1, 1½, 2. */
function halves(n: number): string {
  const twice = Math.max(1, Math.round(n * 2))
  const whole = Math.floor(twice / 2)
  return `${whole > 0 ? whole : ''}${twice % 2 ? '½' : ''}`
}

/** Spoon measures in quarters: 1, 1½, ¼. */
function spoonNumber(n: number): string {
  const quarters = Math.max(1, Math.round(n * 4))
  const whole = Math.floor(quarters / 4)
  const fraction = ['', '¼', '½', '¾'][quarters % 4]
  return `${whole > 0 ? whole : ''}${fraction}`
}

export function formatBase(q: BaseQuantity, ingredient?: Ingredient): string {
  if (q.unit === 'tsp') return q.amount >= 3 ? `${spoonNumber(q.amount / 3)} tbsp` : `${spoonNumber(q.amount)} tsp`
  if (q.unit === 'each') {
    const label = ingredient?.each_label
    const amount = niceNumber(q.amount, 'each')
    if (!label) return amount
    return `${amount} ${q.amount <= 1 ? label : `${label}s`}`
  }
  if (q.amount >= 1000) return `${trim(q.amount / 1000, 2)} ${q.unit === 'g' ? 'kg' : 'l'}`
  return `${niceNumber(q.amount, q.unit)} ${q.unit}`
}

/** Format a recipe quantity scaled by `factor`, e.g. `300 g`, `1.2 kg`, `3 cloves`. */
export function formatQuantity(q: Quantity, factor: number, ingredient?: Ingredient): string {
  const base = toBase(q)
  return formatBase({ amount: base.amount * factor, unit: base.unit }, ingredient)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** Clock time `HH:MM` after adding minutes to a start of `HH:MM`. Wraps past midnight. */
export function addMinutesToClock(clock: string, minutes: number): string {
  const [h = 0, m = 0] = clock.split(':').map(Number)
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** Describe an ingredient line at a scale: `300 g basmati rice`, `3 cloves garlic`, `2 red peppers`, or just the name. */
export function describeQuantity(quantity: Quantity | undefined, factor: number, ingredient: Ingredient): string {
  if (!quantity) return ingredient.name
  const base = toBase(quantity)
  const scaled = { amount: base.amount * factor, unit: base.unit }
  if (scaled.unit === 'each' && !ingredient.each_label) {
    const amount = niceNumber(scaled.amount, 'each')
    return `${amount} ${scaled.amount <= 1 ? ingredient.name : (ingredient.plural ?? ingredient.name)}`
  }
  return `${formatBase(scaled, ingredient)} ${ingredient.name}`
}
