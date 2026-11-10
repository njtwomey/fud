import { CookingPot } from 'lucide-react'
import { useWakeLock } from '../hooks/use-wake-lock'
import { Button } from '../ui/button'

/**
 * "Cooking mode": keeps the screen on so the phone does not go dark mid-recipe. Off by default and reset on each
 * visit, because holding the screen on costs battery. Renders nothing where the browser cannot do it.
 */
export function CookingModeToggle() {
  const { supported, wanted, active, setWanted } = useWakeLock()
  if (!supported) return null
  return (
    <Button
      type="button"
      size="sm"
      variant={wanted ? 'secondary' : 'outline'}
      aria-pressed={wanted}
      title={wanted && !active ? 'Waiting for the browser to allow it' : 'Stops the screen from going to sleep'}
      onClick={() => setWanted(!wanted)}
    >
      <CookingPot />
      {wanted ? 'Screen staying on' : 'Cooking mode'}
    </Button>
  )
}
