import { GraduationCap } from 'lucide-react'
import type { Technique } from '../schema'

interface TechniqueNoteProps {
  technique: Technique
  /** Matches the `aria-controls` of the term that opens it. */
  id: string
}

function Points({ label, items }: { label: string; items: readonly string[] }) {
  if (items.length === 0) return null
  return (
    <>
      <p className="mt-1.5 font-medium text-foreground/70">{label}</p>
      <ul className="list-disc space-y-0.5 pl-4 marker:text-primary/40">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  )
}

/**
 * The in-place explanation of a technique, shown under the line that mentions it: what it is, when you would use it,
 * and a few tips. Deliberately quiet: a faint tint and a left rule, small muted text, so it reads as an aside to the
 * step and not as part of it.
 */
export function TechniqueNote({ technique, id }: TechniqueNoteProps) {
  return (
    <aside
      id={id}
      aria-label={`${technique.name}: how it is done`}
      className="relative z-10 mt-2 mb-1 animate-in rounded-md border-l-2 border-primary/40 bg-primary/5 py-2 pr-3 pl-3.5 text-sm leading-6 text-muted-foreground duration-200 fade-in-0 slide-in-from-top-1 motion-reduce:animate-none"
    >
      <p className="mb-0.5 flex items-center gap-1.5 text-xs font-medium tracking-wide text-primary/80 uppercase">
        <GraduationCap className="size-3.5" aria-hidden />
        {technique.name}
      </p>
      <p>{technique.description}</p>
      <Points label="Use it when" items={technique.when} />
      <Points label="Tips" items={technique.tips} />
    </aside>
  )
}
