import { cn } from 'cn'
import { type ReactNode, useId } from 'react'
import { ScrollArea } from '../ui/scroll-area'

interface ScrollPanelProps {
  title: string
  /** Hide the title visually but keep it for assistive technology, when `actions` already says what this is. */
  hideTitle?: boolean
  /** Controls shown in the fixed header, e.g. tabs or a stepper. */
  actions?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * A bordered panel with a fixed header and its own scrolling body. Give it a bounded height (directly, or by being
 * a flex or grid child of something with one) and it scrolls independently of the rest of the page; with no bounded
 * height it simply grows, which is what small screens want.
 */
export function ScrollPanel({ title, hideTitle, actions, className, children }: ScrollPanelProps) {
  const id = useId()
  return (
    <section
      aria-labelledby={id}
      className={cn('flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card', className)}
    >
      <div className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
        <h2 id={id} className={hideTitle ? 'sr-only' : 'text-sm font-semibold tracking-wide'}>
          {title}
        </h2>
        {actions}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-4 py-4">{children}</div>
      </ScrollArea>
    </section>
  )
}
