import type { Tag, TagDomainDef } from '../schema'
import { Toggle } from '../ui/toggle'

interface TagFilterProps {
  domains: readonly TagDomainDef[]
  tags: readonly Tag[]
  selected: ReadonlySet<string>
  onToggle: (id: string) => void
}

/** Tags grouped by domain. Selecting several narrows the library to recipes that have all of them. */
export function TagFilter({ domains: allDomains, tags, selected, onToggle }: TagFilterProps) {
  const domains = allDomains.filter((d) => tags.some((t) => t.domain === d.id))
  return (
    <div className="space-y-3">
      {domains.map((domain) => (
        <fieldset key={domain.id} className="flex flex-wrap items-center gap-1">
          <legend className="sr-only">{domain.label}</legend>
          <span className="mr-2 w-20 text-xs font-semibold tracking-wide text-muted-foreground uppercase" aria-hidden>
            {domain.label}
          </span>
          {tags
            .filter((t) => t.domain === domain.id)
            .map((tag) => (
              <Toggle
                key={tag.id}
                size="sm"
                variant="outline"
                pressed={selected.has(tag.id)}
                onPressedChange={() => onToggle(tag.id)}
              >
                {tag.label}
              </Toggle>
            ))}
        </fieldset>
      ))}
    </div>
  )
}
