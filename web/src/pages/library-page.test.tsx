import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { StaticCatalogProvider } from '@/lib/catalog'
import { makeCatalog } from '@/lib/testing/fixtures'
import { LibraryPage } from './library-page'

function renderPage() {
  return render(
    <StaticCatalogProvider catalog={makeCatalog()}>
      <MemoryRouter>
        <LibraryPage />
      </MemoryRouter>
    </StaticCatalogProvider>,
  )
}

describe('LibraryPage', () => {
  it('shows search and the recipes, with no descriptive header and the tag filters hidden', () => {
    renderPage()
    expect(screen.getByRole('searchbox', { name: 'Search recipes' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/ingredients and equipment each one needs/)).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Course' })).not.toBeInTheDocument()
    expect(screen.getByText('Garlic Rice')).toBeInTheDocument()
  })

  it('expands the tag filters from the Filters button and collapses them again', async () => {
    renderPage()
    const button = screen.getByRole('button', { name: 'Filters' })
    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('group', { name: 'Course' })).toBeInTheDocument()
    await userEvent.click(button)
    expect(screen.queryByRole('group', { name: 'Course' })).not.toBeInTheDocument()
  })

  it('filters by tag and keeps showing how many filters are active when they are folded away', async () => {
    renderPage()
    await userEvent.click(screen.getByRole('button', { name: 'Filters' }))
    await userEvent.click(within(screen.getByRole('group', { name: 'Course' })).getByRole('button', { name: 'Dinner' }))
    expect(screen.getByText('Garlic Rice')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Filters/ }))
    expect(screen.getByLabelText('1 active')).toBeInTheDocument()
  })

  it('shows an empty state when the search matches nothing', async () => {
    renderPage()
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search recipes' }), 'zzz')
    expect(screen.getByText('Nothing matches')).toBeInTheDocument()
  })
})
