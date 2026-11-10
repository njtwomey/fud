import type { ReactNode } from 'react'
import { useCatalogState } from '@/lib/catalog'
import { ErrorState, LoadingState } from './states'

/** Shows loading and error states until the catalog is ready, so pages can call useCatalog safely. */
export function CatalogGate({ children }: { children: ReactNode }) {
  const state = useCatalogState()
  if (state.status === 'loading') return <LoadingState />
  if (state.status === 'error') return <ErrorState title="Could not load the recipes" description={state.message} />
  return <>{children}</>
}
