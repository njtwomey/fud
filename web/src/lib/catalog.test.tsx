import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CatalogProvider, dataUrl, imageUrl, indexCatalog, loadCatalog, useCatalogState } from './catalog'
import { makeCatalog } from './testing/fixtures'

const respond = (body: unknown, ok = true, status = 200) =>
  (async () => ({ ok, status, json: async () => body })) as unknown as typeof fetch

function Status() {
  const state = useCatalogState()
  return <span>{state.status === 'error' ? `error: ${state.message}` : state.status}</span>
}

describe('loadCatalog', () => {
  it('returns a validated catalog', async () => {
    const catalog = await loadCatalog('/data/catalog.json', respond(makeCatalog()))
    expect(catalog.recipes[0]?.slug).toBe('garlic-rice')
  })
  it('explains how to fix a missing file', async () => {
    await expect(loadCatalog('/x', respond({}, false, 404))).rejects.toThrow(/make data/)
  })
  it('rejects data that does not match the schema', async () => {
    await expect(loadCatalog('/x', respond({ recipes: 'nope' }))).rejects.toThrow()
  })
})

describe('indexCatalog and URLs', () => {
  it('indexes by id and builds data URLs under the base path', () => {
    const index = indexCatalog(makeCatalog())
    expect(index.ingredients.get('garlic')?.name).toBe('garlic')
    expect(index.recipes.get('garlic-rice')?.title).toBe('Garlic Rice')
    expect(dataUrl('catalog.json')).toMatch(/data\/catalog\.json$/)
    expect(imageUrl('r', 'a.jpg')).toMatch(/data\/images\/r\/a\.jpg$/)
  })
})

describe('CatalogProvider', () => {
  it('moves from loading to ready', async () => {
    const original = globalThis.fetch
    globalThis.fetch = respond(makeCatalog())
    render(
      <CatalogProvider url="/c.json">
        <Status />
      </CatalogProvider>,
    )
    expect(screen.getByText('loading')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('ready')).toBeInTheDocument())
    globalThis.fetch = original
  })
  it('surfaces load failures', async () => {
    const original = globalThis.fetch
    globalThis.fetch = respond({}, false, 404)
    render(
      <CatalogProvider url="/c.json">
        <Status />
      </CatalogProvider>,
    )
    await waitFor(() => expect(screen.getByText(/error: .*404/)).toBeInTheDocument())
    globalThis.fetch = original
  })
})
