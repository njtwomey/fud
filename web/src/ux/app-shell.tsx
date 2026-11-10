import { Outlet } from 'react-router'
import { TooltipProvider } from '@/lib/ui/tooltip'
import { CatalogGate } from './catalog-gate'
import { NavBar } from './nav-bar'

/** Page frame: nav bar plus a wide content area so desktop screens are used in full. */
export function AppShell({ title }: { title: string }) {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <NavBar title={title} />
        <main className="mx-auto w-full max-w-[1800px] px-4 py-4 lg:px-6">
          <CatalogGate>
            <Outlet />
          </CatalogGate>
        </main>
      </div>
    </TooltipProvider>
  )
}
