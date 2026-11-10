const TOKEN = /\{([a-z0-9-]+)(?::(name))?\}/g

/** `form: 'name'` came from `{id:name}` and wants just the ingredient name; otherwise quantity and name. */
export type TextPart = { type: 'text'; value: string } | { type: 'ref'; id: string; form: 'full' | 'name' }

/** Ingredient line ids referenced as `{id}` in step text. */
export function textTokens(text: string): string[] {
  return [...text.matchAll(TOKEN)].map((m) => m[1] as string)
}

/** Split step text into plain text and ingredient references so the UI can render scaled quantities. */
export function splitTokens(text: string): TextPart[] {
  const parts: TextPart[] = []
  let last = 0
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) parts.push({ type: 'text', value: text.slice(last, m.index) })
    parts.push({ type: 'ref', id: m[1] as string, form: m[2] === 'name' ? 'name' : 'full' })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) })
  return parts
}

/** Every ingredient line a step touches: `{tokens}` in its text and substeps, plus its explicit `uses`. */
export function stepLineIds(step: { text: string; substeps: string[]; uses: string[] }): Set<string> {
  return new Set([...textTokens(step.text), ...step.substeps.flatMap(textTokens), ...step.uses])
}

/** Replace `{id}` tokens using `resolve`, e.g. to get a short label for a step without quantities. */
export function plainText(text: string, resolve: (id: string) => string): string {
  return text.replace(TOKEN, (_match, id: string) => resolve(id))
}
