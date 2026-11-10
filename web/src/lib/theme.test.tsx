import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider, useTheme } from './theme'

function Probe() {
  const { theme, resolved, setTheme } = useTheme()
  return (
    <>
      <span data-testid="state">{`${theme}:${resolved}`}</span>
      <button type="button" onClick={() => setTheme('dark')}>
        dark
      </button>
      <button type="button" onClick={() => setTheme('light')}>
        light
      </button>
    </>
  )
}

describe('ThemeProvider', () => {
  it('defaults to the system preference', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('state')).toHaveTextContent('system:light')
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('follows a dark system preference', () => {
    window.matchMedia = ((q: string) => ({
      matches: true,
      media: q,
      addEventListener() {},
      removeEventListener() {},
    })) as never
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('state')).toHaveTextContent('system:dark')
    expect(document.documentElement).toHaveClass('dark')
  })

  it('applies the dark class, persists the choice and restores it', async () => {
    const { unmount } = render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    await userEvent.click(screen.getByText('dark'))
    expect(document.documentElement).toHaveClass('dark')
    expect(window.localStorage.getItem('theme')).toBe('dark')
    await userEvent.click(screen.getByText('light'))
    expect(document.documentElement).not.toHaveClass('dark')
    await userEvent.click(screen.getByText('dark'))
    unmount()
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('state')).toHaveTextContent('dark:dark')
  })

  it('throws a clear error outside the provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(/inside ThemeProvider/)
  })
})
