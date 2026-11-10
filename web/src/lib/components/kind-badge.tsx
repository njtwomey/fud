import { Flame, Hourglass, Scissors, UtensilsCrossed } from 'lucide-react'
import type { StepKind } from '../schema'
import { Badge } from '../ui/badge'

/** Presentation for each step kind. Class names are written out in full so Tailwind can see them. */
export const KIND_META = {
  prep: {
    label: 'Prep',
    icon: Scissors,
    text: 'text-kind-prep',
    tint: 'bg-kind-prep/15 text-kind-prep ring-kind-prep/40',
    bar: 'bg-kind-prep',
  },
  cook: {
    label: 'Cook',
    icon: Flame,
    text: 'text-kind-cook',
    tint: 'bg-kind-cook/15 text-kind-cook ring-kind-cook/40',
    bar: 'bg-kind-cook',
  },
  wait: {
    label: 'Wait',
    icon: Hourglass,
    text: 'text-kind-wait',
    tint: 'bg-kind-wait/15 text-kind-wait ring-kind-wait/40',
    bar: 'bg-kind-wait',
  },
  serve: {
    label: 'Serve',
    icon: UtensilsCrossed,
    text: 'text-kind-serve',
    tint: 'bg-kind-serve/15 text-kind-serve ring-kind-serve/40',
    bar: 'bg-kind-serve',
  },
} as const satisfies Record<StepKind, unknown>

export const KIND_BAR_CLASS = {
  prep: KIND_META.prep.bar,
  cook: KIND_META.cook.bar,
  wait: KIND_META.wait.bar,
  serve: KIND_META.serve.bar,
} as const satisfies Record<StepKind, string>

/** Coloured pill for what sort of work a step is: prep, cook, wait or serve. */
export function KindBadge({ kind }: { kind: StepKind }) {
  const { label, icon: Icon, text } = KIND_META[kind]
  return (
    <Badge variant="outline" className={text}>
      <Icon aria-hidden />
      {label}
    </Badge>
  )
}

/** Quiet inline version of the kind label (icon and text, no border) for dense lines of metadata. */
export function KindLabel({ kind }: { kind: StepKind }) {
  const { label, icon: Icon, text } = KIND_META[kind]
  return (
    <span className={`inline-flex items-center gap-1.5 font-medium ${text}`}>
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  )
}
