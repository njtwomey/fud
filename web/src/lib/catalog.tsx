import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { Catalog, type Ingredient, type Recipe, type Tag, type Tool } from './schema'

export interface CatalogIndex {
  catalog: Catalog
  ingredients: Map<string, Ingredient>
  tools: Map<string, Tool>
  tags: Map<string, Tag>
  recipes: Map<string, Recipe>
}

export type CatalogState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; index: CatalogIndex }

export function indexCatalog(catalog: Catalog): CatalogIndex {
  return {
    catalog,
    ingredients: new Map(catalog.ingredients.map((i) => [i.id, i])),
    tools: new Map(catalog.tools.map((t) => [t.id, t])),
    tags: new Map(catalog.tags.map((t) => [t.id, t])),
    recipes: new Map(catalog.recipes.map((r) => [r.slug, r])),
  }
}

/** Fetch the built catalog and validate it at the edge, so a stale or hand-edited file fails loudly. */
export async function loadCatalog(url: string, fetcher: typeof fetch = fetch): Promise<Catalog> {
  const response = await fetcher(url)
  if (!response.ok) throw new Error(`Could not load ${url} (${response.status}). Run 'make data' first.`)
  return Catalog.parse(await response.json())
}

/** URL for a file under `public/data`, honouring the configured base path. */
export function dataUrl(path: string): string {
  return `${import.meta.env.BASE_URL}data/${path}`
}

export const imageUrl = (slug: string, file: string): string => dataUrl(`images/${slug}/${file}`)

const CatalogContext = createContext<CatalogState>({ status: 'loading' })

export function CatalogProvider({ children, url = dataUrl('catalog.json') }: { children: ReactNode; url?: string }) {
  const [state, setState] = useState<CatalogState>({ status: 'loading' })
  useEffect(() => {
    let cancelled = false
    loadCatalog(url)
      .then((catalog) => !cancelled && setState({ status: 'ready', index: indexCatalog(catalog) }))
      .catch(
        (e: unknown) =>
          !cancelled && setState({ status: 'error', message: e instanceof Error ? e.message : String(e) }),
      )
    return () => {
      cancelled = true
    }
  }, [url])
  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>
}

/** Provide an already-loaded catalog (tests, stories). */
export function StaticCatalogProvider({ catalog, children }: { catalog: Catalog; children: ReactNode }) {
  const state = useMemo<CatalogState>(() => ({ status: 'ready', index: indexCatalog(catalog) }), [catalog])
  return <CatalogContext.Provider value={state}>{children}</CatalogContext.Provider>
}

export const useCatalogState = (): CatalogState => useContext(CatalogContext)

/** The loaded catalog. Only call below a gate that has checked the state is ready. */
export function useCatalog(): CatalogIndex {
  const state = useContext(CatalogContext)
  if (state.status !== 'ready') throw new Error('useCatalog called before the catalog finished loading')
  return state.index
}
