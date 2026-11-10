import type { ReactNode } from 'react'
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group'

export interface ViewOption<V extends string> {
  value: V
  label: string
  icon?: ReactNode
}

interface ViewSwitcherProps<V extends string> {
  value: V
  onChange: (value: V) => void
  options: readonly ViewOption<V>[]
  label: string
}

/** Single-choice segmented control, used to pick how the method is arranged. */
export function ViewSwitcher<V extends string>({ value, onChange, options, label }: ViewSwitcherProps<V>) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      aria-label={label}
      // Radix reports '' when the active item is clicked again; keep the current view instead.
      onValueChange={(next) => next && onChange(next as V)}
    >
      {options.map((o) => (
        <ToggleGroupItem key={o.value} value={o.value}>
          {o.icon}
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
