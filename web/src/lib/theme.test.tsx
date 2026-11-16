import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './theme'

function Probe() {
  const { theme, setTheme, toggleTheme } = useTheme()
  return (
    <>
      <span data-testid="state">{theme}</span>
      <button type="button" onClick={toggleTheme}>
        toggle
      </button>
      <button type="button" onClick={() => setTheme('light')}>
        light
      </button>
    </>
  )
}

const prefersDark = (matches: boolean) => {
  window.matchMedia = ((q: string) => ({
    matches,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as never
}

describe('ThemeProvider', () => {
  it('starts from the OS preference when nothing is saved', () => {
    prefersDark(false)
    const { unmount } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('state')).toHaveTextContent('light')
    expect(document.documentElement).not.toHaveClass('dark')
    unmount()

    prefersDark(true)
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('state')).toHaveTextContent('dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('treats an old saved "system" choice as unset', () => {
    prefersDark(false)
    window.localStorage.setItem('theme', 'system')
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('state')).toHaveTextContent('light')
    window.localStorage.clear()
  })

  it('toggles the dark class, persists the choice and restores it', async () => {
    prefersDark(false)
    const { unmount } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    await userEvent.click(screen.getByText('toggle'))
    expect(document.documentElement).toHaveClass('dark')
    expect(window.localStorage.getItem('theme')).toBe('dark')
    await userEvent.click(screen.getByText('light'))
    expect(document.documentElement).not.toHaveClass('dark')
    await userEvent.click(screen.getByText('toggle'))
    unmount()
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('state')).toHaveTextContent('dark')
  })

  it('throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/inside ThemeProvider/)
  })
})
