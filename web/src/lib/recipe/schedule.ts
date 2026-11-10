import type { Recipe } from '../schema'

export interface ScheduleEntry {
  step: string
  /** Minutes from the start of the cook. */
  start: number
  end: number
  /** When hands-on attention ends (start + active_min). */
  activeEnd: number
  /** Latest start that still finishes everything at the earliest possible total time. */
  latestStart: number
  /** latestStart - start: how long this step can be delayed without delaying the meal. */
  slack: number
}

/** Resolve the `after` rules: omitted means 'previous step in the same component', or 0 if first. */
export function stepDependencies(recipe: Recipe): Map<string, string[]> {
  const lastInComponent = new Map<string, string>()
  const deps = new Map<string, string[]>()
  for (const step of recipe.steps) {
    const prev = lastInComponent.get(step.component)
    deps.set(step.id, step.after ?? (prev ? [prev] : []))
    lastInComponent.set(step.component, step.id)
  }
  return deps
}

/**
 * Earliest-start schedule, one entry per step in recipe order. Assumes unlimited hands: steps with no dependency
 * between them run at the same time, even if both need attention. Throws on unknown ids or dependency cycles.
 */
export function computeSchedule(recipe: Recipe): ScheduleEntry[] {
  const steps = new Map(recipe.steps.map((s) => [s.id, s]))
  const deps = stepDependencies(recipe)
  const done = new Map<string, ScheduleEntry>()
  const visiting = new Set<string>()

  const resolve = (id: string): ScheduleEntry => {
    const cached = done.get(id)
    if (cached) return cached
    const step = steps.get(id)
    if (!step) throw new Error(`unknown step '${id}' in after`)
    if (visiting.has(id)) throw new Error(`dependency cycle through step '${id}'`)
    visiting.add(id)
    const start = Math.max(0, ...(deps.get(id) ?? []).map((d) => resolve(d).end))
    visiting.delete(id)
    const entry = {
      step: id,
      start,
      end: start + step.active_min + step.passive_min,
      activeEnd: start + step.active_min,
      latestStart: start,
      slack: 0,
    }
    done.set(id, entry)
    return entry
  }
  const entries = recipe.steps.map((s) => resolve(s.id))

  // Backward pass: a step may start as late as its earliest-starting dependant, or the total if nothing depends on it.
  const total = totalMinutes(entries)
  const dependants = new Map<string, string[]>()
  for (const [id, ds] of deps) for (const d of ds) dependants.set(d, [...(dependants.get(d) ?? []), id])
  const latest = new Map<string, number>()
  const latestStartOf = (id: string): number => {
    const cached = latest.get(id)
    if (cached !== undefined) return cached
    const entry = done.get(id) as ScheduleEntry
    const duration = entry.end - entry.start
    const limit = Math.min(total, ...(dependants.get(id) ?? []).map(latestStartOf))
    const value = limit - duration
    latest.set(id, value)
    return value
  }
  for (const entry of entries) {
    entry.latestStart = latestStartOf(entry.step)
    entry.slack = entry.latestStart - entry.start
  }
  return entries
}

export function totalMinutes(schedule: ScheduleEntry[]): number {
  return Math.max(0, ...schedule.map((e) => e.end))
}

export function activeMinutes(recipe: Recipe): number {
  return recipe.steps.reduce((sum, s) => sum + s.active_min, 0)
}
