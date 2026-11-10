import { Check, TriangleAlert } from 'lucide-react'
import type { Tool } from '../schema'

interface ToolListProps {
  toolIds: readonly string[]
  tools: ReadonlyMap<string, Tool>
  owned: ReadonlySet<string>
  /** Tool ids to emphasise, e.g. those used by the step being read. */
  highlighted?: ReadonlySet<string>
}

/** Equipment a recipe needs, marking what the kitchen lacks and any owned substitute. */
export function ToolList({ toolIds, tools, owned, highlighted }: ToolListProps) {
  return (
    <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
      {toolIds.map((id) => {
        const tool = tools.get(id)
        const has = owned.has(id)
        const substitute = has ? undefined : tool?.substitutes.find((s) => owned.has(s))
        return (
          <li
            key={id}
            data-highlighted={highlighted?.has(id) || undefined}
            className="flex items-center gap-2 rounded-md px-2 py-1 data-[highlighted]:bg-accent data-[highlighted]:font-medium"
          >
            {has ? (
              <Check className="size-4 shrink-0 text-kind-serve" aria-label="Have it" />
            ) : (
              <TriangleAlert className="size-4 shrink-0 text-kind-cook" aria-label="Missing" />
            )}
            <span>{tool?.name ?? id}</span>
            {substitute ? (
              <span className="text-muted-foreground">use {tools.get(substitute)?.name ?? substitute}</span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
