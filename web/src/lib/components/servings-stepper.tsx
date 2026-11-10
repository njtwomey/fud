import { Minus, Plus } from 'lucide-react'
import { Button } from '../ui/button'

interface ServingsStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  label?: string
}

/** Plus/minus control for the number of servings. Quantities elsewhere scale from this value. */
export function ServingsStepper({ value, onChange, min = 1, max = 48, label = 'Servings' }: ServingsStepperProps) {
  return (
    <fieldset className="m-0 inline-flex items-center gap-2 border-0 p-0">
      <legend className="sr-only">{label}</legend>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`Fewer ${label.toLowerCase()}`}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <Minus />
      </Button>
      <output className="min-w-12 text-center font-medium tabular-nums" aria-live="polite">
        {value}
      </output>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={`More ${label.toLowerCase()}`}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <Plus />
      </Button>
    </fieldset>
  )
}
