import { cn } from 'cn'
import { Check, Flame, Thermometer } from 'lucide-react'
import { formatDuration } from '../recipe/units'
import type { Ingredient, IngredientLine, Step } from '../schema'
import { KIND_META, KindLabel } from './kind-badge'
import { StepText } from './step-text'
import { ZoomableImage } from './zoomable-image'

interface StepCardProps {
  step: Step
  number: number
  lines: ReadonlyMap<string, IngredientLine>
  ingredients: ReadonlyMap<string, Ingredient>
  factor: number
  slug: string
  imageSrc: (slug: string, file: string) => string
  done: boolean
  active: boolean
  onToggleDone: (id: string) => void
  onSelect: (id: string) => void
}

function timing(step: Step): string | null {
  if (step.active_min > 0) {
    const waiting = step.passive_min > 0 ? ` + ${formatDuration(step.passive_min)} waiting` : ''
    return `${formatDuration(step.active_min)}${waiting}`
  }
  return step.passive_min > 0 ? `${formatDuration(step.passive_min)} waiting` : null
}

/**
 * One stage of the method. A short headline, then a fuller description; time and temperature sit beside the
 * headline instead of in a footer. The numbered circle carries the step kind's colour and ticks the step off.
 * The whole card selects the step (a stretched button over it), which highlights its ingredients and equipment.
 */
export function StepCard(props: StepCardProps) {
  const { step, number, lines, ingredients, factor, slug, imageSrc, done, active } = props
  const time = timing(step)

  return (
    <li
      data-active={active || undefined}
      className="relative grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4 rounded-xl px-3 py-5 transition-colors hover:bg-accent/30 data-[active]:bg-accent/60"
    >
      <button
        type="button"
        aria-pressed={done}
        aria-label={`Mark step ${number} done`}
        onClick={() => props.onToggleDone(step.id)}
        className={cn(
          'relative z-10 mt-0.5 flex size-9 items-center justify-center rounded-full text-sm font-semibold tabular-nums ring-1 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
          done ? 'bg-primary text-primary-foreground ring-primary' : KIND_META[step.kind].tint,
        )}
      >
        {done ? <Check className="size-4" aria-hidden /> : number}
      </button>

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h3 className={cn('text-lg leading-8 font-semibold', done && 'text-muted-foreground line-through')}>
            <button
              type="button"
              aria-pressed={active}
              onClick={() => props.onSelect(step.id)}
              className="text-left outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring/50"
            >
              {step.title}
            </button>
          </h3>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
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
        </div>

        <p className={cn('text-base leading-7', done && 'text-muted-foreground')}>
          <StepText text={step.text} lines={lines} ingredients={ingredients} factor={factor} />
        </p>

        {step.substeps.length > 0 ? (
          <ul className="list-disc space-y-1.5 pl-5 text-base leading-7 text-foreground/85 marker:text-muted-foreground">
            {step.substeps.map((sub) => (
              <li key={sub}>
                <StepText text={sub} lines={lines} ingredients={ingredients} factor={factor} />
              </li>
            ))}
          </ul>
        ) : null}

        {step.cue ? (
          <p className="border-l-2 pl-3 text-base leading-7 text-muted-foreground">
            <span className="font-medium text-foreground/80">Look for: </span>
            {step.cue}
          </p>
        ) : null}

        {step.photos.length > 0 ? (
          <div className="flex flex-wrap gap-3 pt-1">
            {step.photos.map((photo) => (
              <div key={photo.file} className="w-40">
                <ZoomableImage
                  src={imageSrc(slug, photo.file)}
                  alt={photo.alt}
                  caption={photo.caption}
                  className="aspect-[4/3]"
                />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  )
}
