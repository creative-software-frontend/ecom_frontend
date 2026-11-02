import { useEffect, useState } from "react"

export function useDebouncedValue<T>(value: T, ms: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), ms)
    return () => clearTimeout(timeout)
  }, [value, ms])

  return debouncedValue
}
