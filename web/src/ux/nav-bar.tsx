import { BookOpen, ChefHat, ShoppingBasket } from 'lucide-react'
import { NavLink } from 'react-router'
import { ThemeToggle } from './theme-toggle'

const LINKS = [
  { to: '/', label: 'Recipes', icon: BookOpen, end: true },
  { to: '/shopping', label: 'Shopping', icon: ShoppingBasket, end: false },
] as const

/** Top navigation shown on every page: home link, section links and the theme toggle. */
export function NavBar({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-14 w-full max-w-[1800px] items-center gap-4 px-4 lg:px-6">
        <NavLink to="/" className="flex items-center gap-2 font-semibold">
          <ChefHat aria-hidden />
          {title}
        </NavLink>
        <div className="flex flex-1 items-center gap-1">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent ${isActive ? 'bg-accent' : 'text-muted-foreground'}`
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
        <ThemeToggle />
      </nav>
    </header>
  )
}
