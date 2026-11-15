import { type ElementType, useCallback, useState } from 'react'
import { techniqueTokens } from '../recipe/text'
import type { Ingredient, IngredientLine, Technique } from '../schema'
import { StepText, techniqueNoteId } from './step-text'
import { TechniqueNote } from './technique-note'

interface StepLineProps {
  text: string
  lines: ReadonlyMap<string, IngredientLine>
  ingredients: ReadonlyMap<string, Ingredient>
  factor: number
  techniques?: ReadonlyMap<string, Technique>
  /** Unique within the page, so each expander controls its own note. */
  idPrefix: string
  /** `p` for a step's description, `li` for a substep. */
  as: 'p' | 'li'
  className?: string
}

/**
 * One line of a step's prose. Techniques marked in it open in place: the note appears directly under this line and
 * folds away again, and each line keeps its own open state so reading on elsewhere is never disturbed.
 */
export function StepLine({ text, as, className, idPrefix, techniques, ...rest }: StepLineProps) {
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set())
  const toggle = useCallback(
    (id: string) =>
      setOpen((prev) => {
        const next = new Set(prev)
        if (!next.delete(id)) next.add(id)
        return next
      }),
    [],
  )
  const notes = [...new Set(techniqueTokens(text))].flatMap((id) => {
    const technique = techniques?.get(id)
    return technique && open.has(id)
      ? [<TechniqueNote key={id} technique={technique} id={techniqueNoteId(idPrefix, id)} />]
      : []
  })
  const body = (
    <StepText
      text={text}
      techniques={techniques}
      openTechniques={open}
      onToggleTechnique={toggle}
      idPrefix={idPrefix}
      {...rest}
    />
  )
  const Tag: ElementType = as
  if (as === 'li')
    return (
      <Tag className={className}>
        {body}
        {notes}
      </Tag>
    )
  return (
    <div>
      <Tag className={className}>{body}</Tag>
      {notes}
    </div>
  )
}
