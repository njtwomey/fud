import { ExternalLink } from 'lucide-react'
import type { Source } from '../schema'

interface SourceCreditProps {
  source: Source
  /** Label of the source's kind (for example 'Website'), used when there is no title or address to show. */
  kindLabel?: string
}

function hostOf(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
}

/** Where a recipe comes from: its title and author, a link when the source is a web address, and any note. */
export function SourceCredit({ source, kindLabel }: SourceCreditProps) {
  const link = source.url && /^https?:\/\//i.test(source.url) ? source.url : undefined
  const name = source.title ?? (link ? hostOf(link) : undefined) ?? kindLabel ?? source.kind
  return (
    <p className="text-sm leading-6 text-muted-foreground">
      <span className="font-medium text-foreground/80">Source: </span>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-baseline gap-1 underline decoration-muted-foreground/50 underline-offset-4 hover:text-foreground"
        >
          {name}
          <ExternalLink className="size-3 self-center" aria-hidden />
        </a>
      ) : (
        name
      )}
      {source.author && !name.includes(source.author) ? ` by ${source.author}` : null}
      {source.note ? <span className="block">{source.note}</span> : null}
    </p>
  )
}
