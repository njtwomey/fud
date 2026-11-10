import type { NutritionEstimate } from '../recipe/nutrition'
import type { NutritionValues } from '../schema'

const ROWS: { key: keyof NutritionValues; label: string; unit: string }[] = [
  { key: 'kcal', label: 'Energy', unit: 'kcal' },
  { key: 'fat_g', label: 'Fat', unit: 'g' },
  { key: 'saturates_g', label: 'of which saturates', unit: 'g' },
  { key: 'carbs_g', label: 'Carbohydrate', unit: 'g' },
  { key: 'sugars_g', label: 'of which sugars', unit: 'g' },
  { key: 'fibre_g', label: 'Fibre', unit: 'g' },
  { key: 'protein_g', label: 'Protein', unit: 'g' },
  { key: 'salt_g', label: 'Salt', unit: 'g' },
]

/** Energy is shown in whole kcal; everything else keeps one decimal. */
function format(value: number | undefined, unit: string): string {
  if (value === undefined) return '–'
  return `${unit === 'kcal' ? Math.round(value) : value} ${unit}`
}

/** Estimated nutrition per serving, with a note on how much of the recipe the estimate covers. */
export function NutritionTable({
  estimate,
  names,
}: {
  estimate: NutritionEstimate
  names: ReadonlyMap<string, string>
}) {
  return (
    <div className="space-y-2">
      <table className="w-full text-sm">
        <caption className="sr-only">Estimated nutrition per serving</caption>
        <tbody>
          {ROWS.map(({ key, label, unit }) => (
            <tr key={key} className="border-b last:border-0">
              <th
                scope="row"
                className={`py-1 text-left font-normal ${label.startsWith('of which') ? 'pl-4 text-muted-foreground' : ''}`}
              >
                {label}
              </th>
              <td className="py-1 text-right tabular-nums">{format(estimate.perServing[key], unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-muted-foreground">
        Estimate from typical values, covering {Math.round(estimate.coverage * 100)}% of the ingredients by weight
        {estimate.missing.length > 0 ? `; left out: ${estimate.missing.map((m) => names.get(m) ?? m).join(', ')}` : ''}.
      </p>
    </div>
  )
}
