import { ChefHat, Clock, Users } from 'lucide-react'
import { Link } from 'react-router'
import { formatDuration } from '../recipe/units'
import type { Tag } from '../schema'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'

interface RecipeCardProps {
  to: string
  title: string
  summary?: string
  imageSrc?: string
  imageAlt?: string
  totalMin: number
  servings: number
  tags: Tag[]
}

/** A recipe in the library grid: hero photo (or a placeholder), title, time, servings and tags. */
export function RecipeCard({ to, title, summary, imageSrc, imageAlt, totalMin, servings, tags }: RecipeCardProps) {
  return (
    <Card className="h-full overflow-hidden pt-0 transition-colors hover:bg-accent/40">
      <Link to={to} className="flex h-full flex-col outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        {imageSrc ? (
          <img src={imageSrc} alt={imageAlt ?? ''} className="aspect-video w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground">
            <ChefHat className="size-10" aria-hidden />
          </div>
        )}
        <CardContent className="flex flex-1 flex-col gap-2 pt-4">
          <h2 className="text-lg leading-tight font-semibold">{title}</h2>
          {summary ? <p className="line-clamp-2 text-sm text-muted-foreground">{summary}</p> : null}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-4" aria-hidden />
              {formatDuration(totalMin)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-4" aria-hidden />
              {servings}
            </span>
          </div>
          <div className="mt-auto flex flex-wrap gap-1 pt-2">
            {tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
