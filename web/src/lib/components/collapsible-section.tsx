import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLocalStorage } from '../hooks/use-local-storage'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'

interface CollapsibleSectionProps {
  /** Stable id: names the section for assistive technology and keys the remembered open state. */
  id: string
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

/**
 * A titled block that can be folded away. Whether it is open is remembered in the browser, so a panel stays the
 * size you left it. Sections stack with a divider between them.
 */
export function CollapsibleSection({ id, title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useLocalStorage<boolean>(`section-${id}`, defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <section aria-labelledby={`${id}-title`} className="border-b py-1 last:border-b-0">
        <h3 id={`${id}-title`}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="group flex w-full items-center justify-between rounded-md py-2 text-sm font-semibold tracking-wide outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {title}
              <ChevronDown
                className="size-4 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90"
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
        </h3>
        <CollapsibleContent className="pt-1 pb-3">{children}</CollapsibleContent>
      </section>
    </Collapsible>
  )
}
