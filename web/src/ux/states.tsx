import { CircleAlert, SearchX } from 'lucide-react'
import type { ReactNode } from 'react'
import { Skeleton } from '@/lib/ui/skeleton'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <h2 className="font-semibold">{title}</h2>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  )
}

export function ErrorState({ title, description }: { title: string; description?: string }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-lg border border-destructive/50 p-10 text-center"
    >
      <CircleAlert className="size-8 text-destructive" aria-hidden />
      <h2 className="font-semibold">{title}</h2>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}

export function LoadingState() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    </div>
  )
}
