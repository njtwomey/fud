import { cn } from 'cn'
import { Check } from 'lucide-react'
import type { Ingredient, IngredientLine, Step, Technique } from '../schema'
import { KIND_META } from './kind-badge'
import { StepLine } from './step-line'
import { StepMeta } from './step-meta'
import { ZoomableImage } from './zoomable-image'

interface StepCardProps {
  step: Step
  number: number
  lines: ReadonlyMap<string, IngredientLine>
  ingredients: ReadonlyMap<string, Ingredient>
  factor: number
  slug: string
  imageSrc: (slug: string, file: string) => string
  /** Techniques the step text may explain in place. Optional: without them marked words are plain text. */
  techniques?: ReadonlyMap<string, Technique>
  done: boolean
  active: boolean
  onToggleDone: (id: string) => void
  onSelect: (id: string) => void
}

/**
 * One stage of the method. A short headline, then a fuller description; time and temperature sit beside the
 * headline instead of in a footer. The numbered circle carries the step kind's colour and ticks the step off.
 * The whole card selects the step (a stretched button over it), which highlights its ingredients and equipment.
 */
export function StepCard(props: StepCardProps) {
  const { step, number, lines, ingredients, factor, slug, imageSrc, techniques, done, active } = props
  const shared = { lines, ingredients, factor, techniques }

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
          <StepMeta step={step} />
        </div>

        <StepLine
          as="p"
          text={step.text}
          idPrefix={`${step.id}-text`}
          className={cn('text-base leading-7', done && 'text-muted-foreground')}
          {...shared}
        />

        {step.substeps.length > 0 ? (
          <ul className="list-disc space-y-1.5 pl-5 text-base leading-7 text-foreground/85 marker:text-muted-foreground">
            {step.substeps.map((sub, i) => (
              <StepLine key={sub} as="li" text={sub} idPrefix={`${step.id}-sub${i}`} {...shared} />
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
