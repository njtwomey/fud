import type { ReactNode } from 'react'

interface SectionProps {
  id: string
  title: string
  children: ReactNode
  actions?: ReactNode
}

/** A titled block of a page. Pages are built from these in the order a reader meets them. */
export function Section({ id, title, children, actions }: SectionProps) {
  return (
    <section aria-labelledby={id} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id={id} className="text-lg font-semibold">
          {title}
        </h2>
        {actions}
      </div>
      {children}
    </section>
  )
}
