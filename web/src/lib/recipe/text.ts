/**
 * Step text carries two kinds of markup:
 *   `{line-id}` / `{line-id:name}`   an ingredient, filled in with its scaled quantity and name
 *   `[[technique-id|words]]`         a technique, shown as `words` with an in-place explanation
 */
const MARKUP = /\{([a-z0-9-]+)(?::(name))?\}|\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g

/**
 * `form: 'name'` came from `{id:name}` and wants just the ingredient name; otherwise quantity and name.
 * A technique's `label` is the words as written in the sentence; without one the technique's own name is used.
 */
export type TextPart =
  | { type: 'text'; value: string }
  | { type: 'ref'; id: string; form: 'full' | 'name' }
  | { type: 'technique'; id: string; label?: string }

/** Ingredient line ids referenced as `{id}` in step text. */
export function textTokens(text: string): string[] {
  return [...text.matchAll(MARKUP)].flatMap((m) => (m[1] ? [m[1]] : []))
}

/** Technique ids marked as `[[id|words]]` in step text. */
export function techniqueTokens(text: string): string[] {
  return [...text.matchAll(MARKUP)].flatMap((m) => (m[3] ? [m[3]] : []))
}

/** Split step text into plain text, ingredient references and techniques so the UI can render each properly. */
export function splitTokens(text: string): TextPart[] {
  const parts: TextPart[] = []
  let last = 0
  for (const m of text.matchAll(MARKUP)) {
    if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) })
    if (m[3]) parts.push({ type: 'technique', id: m[3], ...(m[4] ? { label: m[4] } : {}) })
    else parts.push({ type: 'ref', id: m[1] as string, form: m[2] === 'name' ? 'name' : 'full' })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })
  return parts
}

/** Every ingredient line a step touches: `{tokens}` in its text and substeps, plus its explicit `uses`. */
export function stepLineIds(step: { text: string; substeps: string[]; uses: string[] }): Set<string> {
  return new Set([...textTokens(step.text), ...step.substeps.flatMap(textTokens), ...step.uses])
}

/**
 * Replace markup using `resolve`, e.g. to get a short label for a step without quantities. A technique becomes the
 * words as written, or its id when none were given.
 */
export function plainText(text: string, resolve: (id: string) => string): string {
  return text.replace(MARKUP, (_match, id: string | undefined, _form, technique: string | undefined, label?: string) =>
    technique ? (label ?? technique) : resolve(id as string),
  )
}
