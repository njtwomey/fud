import { cn } from 'cn'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useWakeLock } from '../hooks/use-wake-lock'
import { firstUndoneIndex, usedLineIds } from '../recipe/progress'
import { stepLineIds } from '../recipe/text'
import { describeQuantity } from '../recipe/units'
import type { Ingredient, IngredientLine, Step, Technique, Tool } from '../schema'
import { Button } from '../ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from '../ui/dialog'
import { ScrollArea } from '../ui/scroll-area'
import { KIND_BAR_CLASS } from './kind-badge'
import { StepLine } from './step-line'
import { StepMeta } from './step-meta'
import { ZoomableImage } from './zoomable-image'

interface CookingViewProps {
  title: string
  /** The steps in the order they will be cooked (whichever method view is chosen). */
  steps: readonly Step[]
  /** Ingredient lines of the recipe as it will be cooked, with swaps applied. */
  lines: ReadonlyMap<string, IngredientLine>
  ingredients: ReadonlyMap<string, Ingredient>
  tools: ReadonlyMap<string, Tool>
  techniques?: ReadonlyMap<string, Technique>
  factor: number
  slug: string
  imageSrc: (slug: string, file: string) => string
  /** Finished step ids. Owned by the caller so the recipe page and this view always agree. */
  done: ReadonlySet<string>
  onDoneChange: (stepId: string, done: boolean) => void
  /** The full ingredient list for the side column, told which lines to highlight and which are used up. */
  renderIngredients: (state: { highlighted: ReadonlySet<string>; used: ReadonlySet<string> }) => ReactNode
  onClose: () => void
}

/**
 * Cook along, one step at a time. A full-screen view with the current step in large type, what it needs (ingredients
 * with their amounts, equipment), a progress bar to jump around, and Back and Next. Moving on ticks the step off
 * and so fades its ingredients in the list; going back undoes it. The screen is kept awake while it is open.
 * Left and right arrow keys move between steps.
 */
export function CookingView(props: CookingViewProps) {
  const { title, steps, lines, ingredients, tools, techniques, factor, slug, imageSrc, done } = props
  const [index, setIndex] = useState(() => firstUndoneIndex(steps, done))
  const { setWanted } = useWakeLock()
  useEffect(() => {
    setWanted(true)
    return () => setWanted(false)
  }, [setWanted])

  const step = steps[index]
  const last = index === steps.length - 1
  const used = useMemo(() => usedLineIds(steps, done), [steps, done])
  const highlighted = useMemo(() => (step ? stepLineIds(step) : new Set<string>()), [step])

  const { onDoneChange, onClose } = props
  const next = () => {
    if (!step) return
    onDoneChange(step.id, true)
    if (last) onClose()
    else setIndex(index + 1)
  }
  const back = () => {
    const previous = steps[index - 1]
    if (!previous) return
    onDoneChange(previous.id, false)
    setIndex(index - 1)
  }
  // Arrow keys. No dependency list on purpose: the handlers are rebuilt each render and this always sees the latest.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') next()
      else if (event.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!step) return null
  const needs = [...highlighted].flatMap((id) => {
    const line = lines.get(id)
    const ingredient = line && ingredients.get(line.ingredient)
    return line && ingredient ? [{ line, text: describeQuantity(line.quantity, factor, ingredient) }] : []
  })
  const prose = { lines, ingredients, factor, techniques }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        aria-describedby={undefined}
        className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 sm:max-w-none"
      >
        <header className="shrink-0 space-y-3 border-b px-4 pt-3 pb-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="truncate text-sm font-semibold">
              <span className="text-muted-foreground">Cooking </span>
              {title}
            </DialogTitle>
            <div className="flex items-center gap-3">
              <p aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
                Step {index + 1} of {steps.length}
              </p>
              <DialogClose asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Close cooking view">
                  <X />
                </Button>
              </DialogClose>
            </div>
          </div>
          <DialogDescription className="sr-only">Step by step, with the ingredients each step uses.</DialogDescription>
          <ol className="flex gap-1" aria-label="Steps">
            {steps.map((s, i) => (
              <li key={s.id} className="flex-1">
                <button
                  type="button"
                  aria-label={`Go to step ${i + 1}: ${s.title}`}
                  aria-current={i === index ? 'step' : undefined}
                  title={s.title}
                  onClick={() => setIndex(i)}
                  className="group flex h-4 w-full items-center outline-none"
                >
                  <span
                    className={cn(
                      'block w-full rounded-full transition-all group-focus-visible:ring-3 group-focus-visible:ring-ring/50',
                      KIND_BAR_CLASS[s.kind],
                      i === index ? 'h-2.5' : 'h-1.5 group-hover:h-2.5',
                      done.has(s.id) ? 'opacity-100' : i === index ? 'opacity-90' : 'opacity-25',
                    )}
                  />
                </button>
              </li>
            ))}
          </ol>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <ScrollArea className="min-h-0">
            <article key={step.id} className="mx-auto max-w-3xl space-y-6 px-5 py-6 sm:px-8 sm:py-10">
              <div className="space-y-3">
                <StepMeta
                  step={step}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-muted-foreground"
                />
                <h2 className="text-3xl leading-tight font-semibold tracking-tight">{step.title}</h2>
              </div>

              <StepLine as="p" text={step.text} idPrefix="cook-text" className="text-xl leading-9" {...prose} />

              {step.substeps.length > 0 ? (
                <ul className="list-disc space-y-2 pl-6 text-lg leading-8 text-foreground/85 marker:text-muted-foreground">
                  {step.substeps.map((sub, i) => (
                    <StepLine key={sub} as="li" text={sub} idPrefix={`cook-sub${i}`} {...prose} />
                  ))}
                </ul>
              ) : null}

              {step.cue ? (
                <p className="border-l-2 pl-4 text-lg leading-8 text-muted-foreground">
                  <span className="font-medium text-foreground/80">Look for: </span>
                  {step.cue}
                </p>
              ) : null}

              {needs.length > 0 || step.tools.length > 0 ? (
                <section aria-label="What this step needs" className="rounded-xl border bg-card/50 p-4">
                  <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                    {needs.length > 0 ? (
                      <div>
                        <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          Ingredients
                        </h3>
                        <ul className="space-y-1 text-base">
                          {needs.map(({ line, text }) => (
                            <li key={line.id}>
                              <span className="font-medium">{text}</span>
                              {line.note ? <span className="text-muted-foreground"> ({line.note})</span> : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {step.tools.length > 0 ? (
                      <div>
                        <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                          Equipment
                        </h3>
                        <ul className="space-y-1 text-base">
                          {step.tools.map((t) => (
                            <li key={t.tool}>
                              {tools.get(t.tool)?.name ?? t.tool}
                              {t.note ? (
                                <span className="text-muted-foreground"> ({t.note.replace(/\.$/, '')})</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {step.photos.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {step.photos.map((photo) => (
                    <div key={photo.file} className="w-56">
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
            </article>
          </ScrollArea>

          <aside aria-label="All ingredients" className="hidden min-h-0 border-l lg:block">
            <ScrollArea className="h-full">
              <div className="px-4 py-4">
                <h3 className="mb-3 text-sm font-semibold tracking-wide">Ingredients</h3>
                {props.renderIngredients({ highlighted, used })}
              </div>
            </ScrollArea>
          </aside>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t px-4 py-3 sm:px-6">
          <Button variant="outline" size="lg" onClick={back} disabled={index === 0}>
            <ArrowLeft />
            Back
          </Button>
          <p className="hidden min-w-0 truncate text-sm text-muted-foreground sm:block">
            {last ? 'Last step' : `Next: ${steps[index + 1]?.title}`}
          </p>
          <Button size="lg" onClick={next}>
            {last ? (
              <>
                <Check />
                Finish
              </>
            ) : (
              <>
                Next step
                <ArrowRight />
              </>
            )}
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  )
}
