import { CalendarClock } from 'lucide-react'
import type { ScheduleEntry } from '../recipe/schedule'
import { addMinutesToClock, formatDuration } from '../recipe/units'
import type { Recipe } from '../schema'
import { KIND_BAR_CLASS } from './kind-badge'

interface TimelineProps {
  recipe: Recipe
  schedule: readonly ScheduleEntry[]
  /** `HH:MM` when the meal should be ready. Turns offsets into clock times. */
  serveAt?: string
}

/**
 * Gantt-style view of when each step runs, one row per step. Solid bars are hands-on time, faded bars are
 * hands-off time, and the dashed extension shows how late a step can start without delaying the meal.
 */
export function Timeline({ recipe, schedule, serveAt }: TimelineProps) {
  const total = Math.max(1, ...schedule.map((e) => e.end))
  const byStep = new Map(schedule.map((e) => [e.step, e]))
  const clock = (minutes: number) => (serveAt ? addMinutesToClock(serveAt, minutes - total) : formatDuration(minutes))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(total * f))

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {serveAt
          ? `Start at ${clock(0)} to serve at ${serveAt}.`
          : `Ready in ${formatDuration(total)} from the first step.`}
      </p>
      <div className="relative ml-0 grid grid-cols-[minmax(8rem,16rem)_1fr] gap-x-3 text-sm">
        <div />
        <div className="relative h-5 text-xs text-muted-foreground" aria-hidden>
          {ticks.map((t) => (
            <span key={t} className="absolute -translate-x-1/2 tabular-nums" style={{ left: `${(t / total) * 100}%` }}>
              {serveAt ? clock(t) : `${t}′`}
            </span>
          ))}
        </div>
        {recipe.steps.map((step) => {
          const entry = byStep.get(step.id)
          if (!entry) return null
          const duration = entry.end - entry.start
          const activeW = duration === 0 ? 0 : ((entry.activeEnd - entry.start) / total) * 100
          return (
            <div key={step.id} className="contents">
              <div className="flex items-center gap-1 truncate py-1.5 pr-2" title={step.title}>
                {step.make_ahead ? (
                  <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" aria-label="can do ahead" />
                ) : null}
                <span className="truncate">{step.title}</span>
              </div>
              <div
                className="relative my-1.5 h-5 rounded bg-muted/50"
                role="img"
                aria-label={`${step.title}: ${clock(entry.start)} to ${clock(entry.end)}`}
              >
                {entry.slack > 0 ? (
                  <div
                    className="absolute top-1/2 h-0 border-t-2 border-dashed border-muted-foreground/50"
                    style={{
                      left: `${(entry.start / total) * 100}%`,
                      width: `${((entry.latestStart - entry.start + duration) / total) * 100}%`,
                    }}
                  />
                ) : null}
                <div
                  className={`absolute top-0 h-full rounded ${KIND_BAR_CLASS[step.kind]} opacity-40`}
                  style={{
                    left: `${(entry.start / total) * 100}%`,
                    width: `${Math.max((duration / total) * 100, 0.8)}%`,
                  }}
                />
                <div
                  className={`absolute top-0 h-full rounded ${KIND_BAR_CLASS[step.kind]}`}
                  style={{
                    left: `${(entry.start / total) * 100}%`,
                    width: `${Math.max(activeW, duration === 0 ? 0.8 : 0)}%`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
