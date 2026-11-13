import { useEffect } from "react"

/**
 * Calls `onEscape` when the user presses Escape while `enabled` is true.
 * Used by modals/drawers so the behaviour is defined in one place.
 */
export function useEscapeKey(onEscape: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape()
    }

    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onEscape, enabled])
}
