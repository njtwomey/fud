import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { estimateNutrition } from '../recipe/nutrition'
import { computeSchedule } from '../recipe/schedule'
import { buildShoppingList, groupByCategory } from '../recipe/shopping'
import type { ChosenSwaps } from '../recipe/swaps'
import type { Catalog, SwapOption } from '../schema'
import { makeCatalog, makeRecipe } from '../testing/fixtures'
import { CollapsibleSection } from './collapsible-section'
import { CookingModeToggle } from './cooking-mode-toggle'
import { IngredientPanel } from './ingredient-panel'
import { KindBadge, KindLabel } from './kind-badge'
import { NutritionTable } from './nutrition-table'
import { RecipeCard } from './recipe-card'
import { ScrollPanel } from './scroll-panel'
import { ServingsStepper } from './servings-stepper'
import { ShoppingList } from './shopping-list'
import { StepCard } from './step-card'
import { StepText } from './step-text'
import { TagFilter } from './tag-filter'
import { Timeline } from './timeline'
import { ToolList } from './tool-list'
import { ViewSwitcher } from './view-switcher'
import { ZoomableImage } from './zoomable-image'

const catalog: Catalog = makeCatalog()
const recipe = makeRecipe()
const ingredients = new Map(catalog.ingredients.map((i) => [i.id, i]))
const tools = new Map(catalog.tools.map((t) => [t.id, t]))
const lines = new Map(recipe.components.flatMap((c) => c.ingredients).map((l) => [l.id, l]))

describe('ServingsStepper', () => {
  it('increments and decrements and reports the new value', async () => {
    const onChange = vi.fn()
    render(<ServingsStepper value={4} onChange={onChange} />)
    expect(screen.getByRole('status')).toHaveTextContent('4')
    await userEvent.click(screen.getByRole('button', { name: /more servings/i }))
    await userEvent.click(screen.getByRole('button', { name: /fewer servings/i }))
    expect(onChange).toHaveBeenNthCalledWith(1, 5)
    expect(onChange).toHaveBeenNthCalledWith(2, 3)
  })

  it('disables the buttons at the limits', () => {
    render(<ServingsStepper value={1} min={1} max={1} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /fewer/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /more/i })).toBeDisabled()
  })
})

describe('KindBadge and KindLabel', () => {
  it.each(['prep', 'cook', 'wait', 'serve'] as const)('renders a label for %s', (kind) => {
    render(<KindBadge kind={kind} />)
    expect(screen.getByText(new RegExp(kind, 'i'))).toBeInTheDocument()
  })

  it('shows the kind as plain text with an icon', () => {
    render(<KindLabel kind="wait" />)
    expect(screen.getByText('Wait')).toBeInTheDocument()
  })
})

describe('ScrollPanel', () => {
  it('labels the region by its title and renders its controls and content', () => {
    render(
      <ScrollPanel title="Ingredients" actions={<button type="button">Action</button>}>
        <p>Body text</p>
      </ScrollPanel>,
    )
    const region = screen.getByRole('region', { name: 'Ingredients' })
    expect(within(region).getByRole('button', { name: 'Action' })).toBeInTheDocument()
    expect(within(region).getByText('Body text')).toBeInTheDocument()
  })

  it('can hide the visible title without removing the accessible name', () => {
    render(
      <ScrollPanel title="Method" hideTitle>
        <p>x</p>
      </ScrollPanel>,
    )
    expect(screen.getByRole('region', { name: 'Method' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Method' })).toHaveClass('sr-only')
  })
})

describe('StepText', () => {
  const render2 = (text: string, factor = 1) =>
    render(<StepText text={text} lines={lines} ingredients={ingredients} factor={factor} />)

  it('replaces tokens with scaled quantities and names', () => {
    const { rerender } = render2('Fry {garlic} in {oil}.')
    expect(screen.getByText('2 cloves garlic')).toBeInTheDocument()
    expect(screen.getByText('20 ml olive oil')).toBeInTheDocument()
    rerender(<StepText text="Fry {garlic} in {oil}." lines={lines} ingredients={ingredients} factor={2} />)
    expect(screen.getByText('4 cloves garlic')).toBeInTheDocument()
  })

  it('shows just the ingredient name for the :name form, regardless of scale', () => {
    render2('Stir the {rice:name} well.', 3)
    expect(screen.getByText('basmati rice')).toBeInTheDocument()
    expect(screen.queryByText(/600 g/)).not.toBeInTheDocument()
  })
})

describe('IngredientPanel', () => {
  const jasmine: SwapOption = { ingredient: 'jasmine-rice', ratio: 1, quality: 'fine', note: 'Stickier.' }
  const panel = (
    factor: number,
    extra: {
      highlighted?: Set<string>
      chosen?: ChosenSwaps
      onSwap?: (id: string, o: SwapOption | null) => void
    } = {},
  ) => (
    <IngredientPanel
      recipe={recipe}
      factor={factor}
      ingredients={ingredients}
      swaps={catalog.swaps}
      qualities={catalog.swap_qualities}
      chosen={extra.chosen ?? {}}
      onSwap={extra.onSwap ?? (() => {})}
      highlighted={extra.highlighted}
    />
  )

  it('groups by component and scales quantities', () => {
    const { rerender } = render(panel(1))
    expect(screen.getByRole('heading', { name: 'For the rice' })).toBeInTheDocument()
    expect(screen.getByText('200 g basmati rice')).toBeInTheDocument()
    rerender(panel(2.5))
    expect(screen.getByText('500 g basmati rice')).toBeInTheDocument()
  })

  it('lists ingredients without any preparation wording', () => {
    render(panel(1))
    expect(screen.queryByText(/sliced/i)).not.toBeInTheDocument()
    expect(screen.getByText('2 cloves garlic')).toBeInTheDocument()
  })

  it('marks optional lines and highlights lines used by the active step', () => {
    render(panel(1, { highlighted: new Set(['rice']) }))
    expect(screen.getByText('optional')).toBeInTheDocument()
    expect(screen.getByText('200 g basmati rice').closest('li')).toHaveAttribute('data-highlighted')
  })

  it('ticks ingredients off', async () => {
    render(panel(1))
    const box = screen.getByRole('checkbox', { name: /basmati rice/i })
    await userEvent.click(box)
    expect(box).toBeChecked()
  })

  it('offers swaps with quality labels from the data and reports the one picked', async () => {
    const onSwap = vi.fn()
    render(panel(1, { onSwap }))
    await userEvent.click(screen.getByRole('button', { name: 'Swaps for basmati rice' }))
    expect(await screen.findByText(/Works well\. Stickier\./)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /jasmine rice/ }))
    expect(onSwap).toHaveBeenCalledWith('rice', expect.objectContaining({ ingredient: 'jasmine-rice' }))
  })

  it('shows the swapped ingredient and amount, says what it replaced, and can go back', async () => {
    const onSwap = vi.fn()
    render(panel(1, { chosen: { rice: { ...jasmine, ratio: 1.5 } }, onSwap }))
    expect(screen.getByText('300 g jasmine rice')).toBeInTheDocument()
    expect(screen.getByText('instead of basmati rice')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Swaps for jasmine rice' }))
    await userEvent.click(screen.getByRole('button', { name: /As written/ }))
    expect(onSwap).toHaveBeenCalledWith('rice', null)
  })
})

describe('StepCard', () => {
  const step = recipe.steps.find((s) => s.id === 'boil')!
  const renderCard = (onSelect = vi.fn(), onToggleDone = vi.fn(), active = false) =>
    render(
      <ol>
        <StepCard
          step={step}
          number={2}
          lines={lines}
          ingredients={ingredients}
          factor={1}
          slug="garlic-rice"
          imageSrc={(slug, file) => `/img/${slug}/${file}`}
          done={false}
          active={active}
          onToggleDone={onToggleDone}
          onSelect={onSelect}
        />
      </ol>,
    )

  it('leads with the headline, then the description with scaled ingredients', () => {
    renderCard()
    expect(screen.getByRole('heading', { name: 'Cook the rice' })).toBeInTheDocument()
    expect(screen.getByText('200 g basmati rice')).toBeInTheDocument()
  })

  it('shows time and the sensory cue beside and below the text, with no footer of equipment', () => {
    renderCard()
    expect(screen.getByText('2 min + 12 min waiting')).toBeInTheDocument()
    expect(screen.getByText(/The grains are tender/)).toBeInTheDocument()
    expect(screen.queryByText(/Equipment/)).not.toBeInTheDocument()
  })

  it('reports completion from the numbered circle', async () => {
    const onToggleDone = vi.fn()
    renderCard(vi.fn(), onToggleDone)
    const toggle = screen.getByRole('button', { name: 'Mark step 2 done' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(toggle)
    expect(onToggleDone).toHaveBeenCalledWith('boil')
  })

  it('selects the step from its headline button, which stretches over the whole card', async () => {
    const onSelect = vi.fn()
    renderCard(onSelect)
    const select = screen.getByRole('button', { name: 'Cook the rice' })
    expect(select).toHaveClass('after:absolute', 'after:inset-0')
    await userEvent.click(select)
    expect(onSelect).toHaveBeenCalledWith('boil')
  })

  it('marks the active step', () => {
    renderCard(vi.fn(), vi.fn(), true)
    expect(screen.getByRole('listitem')).toHaveAttribute('data-active')
    expect(screen.getByRole('button', { name: 'Cook the rice' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Timeline', () => {
  const schedule = computeSchedule(recipe)
  it('shows the total and one row per step, labelled by step title', () => {
    render(<Timeline recipe={recipe} schedule={schedule} />)
    expect(screen.getByText(/Ready in 15 min/)).toBeInTheDocument()
    expect(screen.getAllByRole('img')).toHaveLength(recipe.steps.length)
    expect(screen.getAllByText('Cook the rice').length).toBeGreaterThan(0)
  })
  it('turns offsets into clock times when a serving time is given', () => {
    render(<Timeline recipe={recipe} schedule={schedule} serveAt="19:00" />)
    expect(screen.getByText('Start at 18:45 to serve at 19:00.')).toBeInTheDocument()
  })
})

describe('NutritionTable and ToolList', () => {
  it('shows per-serving values and what was left out', () => {
    const estimate = estimateNutrition(recipe, ingredients)!
    render(<NutritionTable estimate={estimate} names={new Map([['oil', 'olive oil']])} />)
    expect(within(screen.getByRole('table')).getByText('439 kcal')).toBeInTheDocument()
    expect(screen.getByText(/covering 100%/)).toBeInTheDocument()
  })
  it('marks missing equipment and offers an owned substitute', () => {
    render(<ToolList toolIds={['knife', 'saucepan']} tools={tools} owned={new Set(['knife', 'rice-cooker'])} />)
    expect(screen.getByLabelText('Have it')).toBeInTheDocument()
    expect(screen.getByLabelText('Missing')).toBeInTheDocument()
    expect(screen.getByText('use rice cooker')).toBeInTheDocument()
  })
  it('highlights the equipment used by the selected step', () => {
    render(
      <ToolList
        toolIds={['knife', 'saucepan']}
        tools={tools}
        owned={new Set(['knife', 'saucepan'])}
        highlighted={new Set(['saucepan'])}
      />,
    )
    expect(screen.getByText('saucepan').closest('li')).toHaveAttribute('data-highlighted')
    expect(screen.getByText("chef's knife").closest('li')).not.toHaveAttribute('data-highlighted')
  })
})

describe('RecipeCard', () => {
  it('links to the recipe and shows time, servings and tags', () => {
    render(
      <MemoryRouter>
        <RecipeCard to="/recipes/garlic-rice" title="Garlic Rice" totalMin={75} servings={2} tags={catalog.tags} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link')).toHaveAttribute('href', '/recipes/garlic-rice')
    expect(screen.getByText('1 h 15 min')).toBeInTheDocument()
    expect(screen.getByText('Dinner')).toBeInTheDocument()
  })
})

describe('TagFilter', () => {
  it('groups tags under data-defined domain labels and toggles', async () => {
    const onToggle = vi.fn()
    render(<TagFilter domains={catalog.tag_domains} tags={catalog.tags} selected={new Set()} onToggle={onToggle} />)
    expect(screen.getByRole('group', { name: 'Course' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Dinner' }))
    expect(onToggle).toHaveBeenCalledWith('dinner')
  })
})

describe('ViewSwitcher', () => {
  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ]
  it('switches views but keeps the current one when it is clicked again', async () => {
    const onChange = vi.fn()
    render(<ViewSwitcher value="a" onChange={onChange} options={options} label="View" />)
    await userEvent.click(screen.getByRole('radio', { name: 'Beta' }))
    expect(onChange).toHaveBeenCalledWith('b')
    onChange.mockClear()
    await userEvent.click(screen.getByRole('radio', { name: 'Alpha' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('ShoppingList', () => {
  it('uses category labels and order from the data and ticks items off', async () => {
    const items = buildShoppingList([{ recipe, servings: 2 }])
    render(<ShoppingList groups={groupByCategory(items, ingredients, catalog.categories)} ingredients={ingredients} />)
    const headings = screen.getAllByRole('heading').map((h) => h.textContent)
    expect(headings).toEqual(['Fruit and veg', 'Rice, grains and pasta', 'Oils and fats'])
    const rice = screen.getByRole('checkbox', { name: /basmati rice/i })
    await userEvent.click(rice)
    expect(rice).toBeChecked()
  })

  it('pluralises counted items and shows halves and spoon fractions', () => {
    const items = buildShoppingList([{ recipe, servings: 6 }])
    render(<ShoppingList groups={groupByCategory(items, ingredients, catalog.categories)} ingredients={ingredients} />)
    expect(screen.getByText('6 cloves garlic')).toBeInTheDocument()
  })
})

describe('ZoomableImage', () => {
  it('shows a thumbnail button that opens the full photo with its caption, and closes again', async () => {
    render(<ZoomableImage src="/img/a.jpg" alt="Charred broccoli" caption="Look for dark edges, not black." />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Enlarge photo: Charred broccoli' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByRole('img', { name: 'Charred broccoli' })).toHaveAttribute('src', '/img/a.jpg')
    expect(within(dialog).getByText('Look for dark edges, not black.')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('works without a caption', async () => {
    render(<ZoomableImage src="/img/a.jpg" alt="Charred broccoli" />)
    await userEvent.click(screen.getByRole('button', { name: /Enlarge photo/ }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).not.toHaveAttribute('aria-describedby')
  })
})

describe('StepCard photos', () => {
  it('opens a step photo in a modal with its caption, and keeps the thumbnail above the card-wide select button', async () => {
    const step = {
      ...recipe.steps[0]!,
      photos: [{ file: 'roast.jpg', alt: 'Roasted vegetables', caption: 'Edges just charred.' }],
    }
    render(
      <ol>
        <StepCard
          step={step}
          number={1}
          lines={lines}
          ingredients={ingredients}
          factor={1}
          slug="garlic-rice"
          imageSrc={(slug, file) => `/img/${slug}/${file}`}
          done={false}
          active={false}
          onToggleDone={() => {}}
          onSelect={() => {}}
        />
      </ol>,
    )
    const thumb = screen.getByRole('button', { name: 'Enlarge photo: Roasted vegetables' })
    expect(thumb).toHaveClass('relative', 'z-10')
    await userEvent.click(thumb)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Edges just charred.')).toBeInTheDocument()
    expect(within(dialog).getByRole('img')).toHaveAttribute('src', '/img/garlic-rice/roast.jpg')
  })
})

describe('CollapsibleSection', () => {
  it('is open by default, folds away when its title is pressed, and remembers the choice', async () => {
    const { unmount } = render(
      <CollapsibleSection id="notes" title="Notes">
        <p>Body</p>
      </CollapsibleSection>,
    )
    expect(screen.getByText('Body')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Notes' }))
    expect(screen.queryByText('Body')).not.toBeInTheDocument()
    expect(window.localStorage.getItem('section-notes')).toBe('false')
    unmount()
    render(
      <CollapsibleSection id="notes" title="Notes">
        <p>Body</p>
      </CollapsibleSection>,
    )
    expect(screen.queryByText('Body')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Notes' }))
    expect(screen.getByText('Body')).toBeVisible()
  })

  it('can start closed and is labelled by its title', () => {
    render(
      <CollapsibleSection id="extra" title="Extra" defaultOpen={false}>
        <p>Hidden</p>
      </CollapsibleSection>,
    )
    expect(screen.getByRole('region', { name: 'Extra' })).toBeInTheDocument()
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })
})

describe('CookingModeToggle', () => {
  function fakeWakeLock() {
    const listeners: (() => void)[] = []
    const sentinel = {
      release: vi.fn(async () => {
        for (const l of listeners) l()
      }),
      addEventListener: (_: string, l: () => void) => listeners.push(l),
    }
    const request = vi.fn(async () => sentinel)
    Object.defineProperty(navigator, 'wakeLock', { value: { request }, configurable: true })
    return {
      request,
      sentinel,
      dropLock: () => {
        for (const l of listeners) l()
      },
    }
  }
  const setVisibility = (state: 'visible' | 'hidden') => {
    Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  }

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'wakeLock')
    setVisibility('visible')
  })

  it('renders nothing where the browser has no wake lock', () => {
    Reflect.deleteProperty(navigator, 'wakeLock')
    const { container } = render(<CookingModeToggle />)
    expect(container).toBeEmptyDOMElement()
  })

  it('asks the browser to keep the screen on when switched on, and lets go when switched off', async () => {
    const { request, sentinel } = fakeWakeLock()
    render(<CookingModeToggle />)
    const button = screen.getByRole('button', { name: 'Cooking mode' })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    expect(request).not.toHaveBeenCalled()
    await userEvent.click(button)
    expect(request).toHaveBeenCalledWith('screen')
    expect(await screen.findByRole('button', { name: 'Screen staying on' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(screen.getByRole('button', { name: 'Screen staying on' }))
    expect(sentinel.release).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Cooking mode' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('asks again when the page comes back to the front after the browser dropped the lock', async () => {
    const { request, dropLock } = fakeWakeLock()
    render(<CookingModeToggle />)
    await userEvent.click(screen.getByRole('button', { name: 'Cooking mode' }))
    expect(request).toHaveBeenCalledTimes(1)
    await act(async () => {
      setVisibility('hidden')
      dropLock()
    })
    await act(async () => setVisibility('visible'))
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('stays switched on but quietly inactive when the browser refuses', async () => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: {
        request: vi.fn(async () => {
          throw new Error('denied')
        }),
      },
      configurable: true,
    })
    render(<CookingModeToggle />)
    await userEvent.click(screen.getByRole('button', { name: 'Cooking mode' }))
    expect(await screen.findByRole('button', { name: 'Screen staying on' })).toHaveAttribute(
      'title',
      'Waiting for the browser to allow it',
    )
  })

  it('releases the lock when the page is left', async () => {
    const { sentinel } = fakeWakeLock()
    const { unmount } = render(<CookingModeToggle />)
    await userEvent.click(screen.getByRole('button', { name: 'Cooking mode' }))
    unmount()
    expect(sentinel.release).toHaveBeenCalled()
  })
})
