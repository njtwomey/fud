import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router'
import { CatalogProvider } from '@/lib/catalog'
import { ThemeProvider } from '@/lib/theme'
import { LibraryPage } from '@/pages/library-page'
import { RecipePage } from '@/pages/recipe-page'
import { ShoppingPage } from '@/pages/shopping-page'
import { AppShell } from '@/ux/app-shell'
import { ErrorState } from '@/ux/states'
import './index.css'

const title = import.meta.env.VITE_APP_TITLE || 'Fud'
document.title = title

// Hash routing keeps deep links and refreshes working on static hosts such as GitHub Pages.
const router = createHashRouter([
  {
    path: '/',
    element: <AppShell title={title} />,
    children: [
      { index: true, element: <LibraryPage /> },
      { path: 'recipes/:slug', element: <RecipePage /> },
      { path: 'shopping', element: <ShoppingPage /> },
      { path: '*', element: <ErrorState title="Page not found" /> },
    ],
  },
])

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <CatalogProvider>
        <RouterProvider router={router} />
      </CatalogProvider>
    </ThemeProvider>
  </StrictMode>,
)
