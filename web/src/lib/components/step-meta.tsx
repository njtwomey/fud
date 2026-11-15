import { Flame, Thermometer } from 'lucide-react'
import { formatDuration } from '../recipe/units'
import type { Step } from '../schema'
import { KindLabel } from './kind-badge'

/** "5 min", "2 min + 15 min waiting", or null when the step has no duration. */
export function stepTiming(step: Step): string | null {
  if (step.active_min > 0) {
    const waiting = step.passive_min > 0 ? ` + ${formatDuration(step.passive_min)} waiting` : ''
    return `${formatDuration(step.active_min)}${waiting}`
  }
  return step.passive_min > 0 ? `${formatDuration(step.passive_min)} waiting` : null
}

/** The facts beside a step's headline: its kind, how long it takes, oven temperature, heat, and if it can be done ahead. */
export function StepMeta({ step, className }: { step: Step; className?: string }) {
  const time = stepTiming(step)
  return (
    <p className={className ?? 'flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground'}>
      <KindLabel kind={step.kind} />
      {time ? <span>{time}</span> : null}
      {step.temperature ? (
        <span className="inline-flex items-center gap-1">
          <Thermometer className="size-3.5" aria-hidden />
          {step.temperature.celsius} °C {step.temperature.mode}
        </span>
      ) : null}
      {step.heat ? (
        <span className="inline-flex items-center gap-1">
          <Flame className="size-3.5" aria-hidden />
          {step.heat} heat
        </span>
      ) : null}
      {step.make_ahead ? <span>can be done ahead</span> : null}
    </p>
  )
}
