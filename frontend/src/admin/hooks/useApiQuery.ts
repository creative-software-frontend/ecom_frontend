import { useCallback, useEffect, useRef, useState } from "react"

type UseApiQueryOptions = {
  keepPreviousData?: boolean
}

type UseApiQueryResult<T> = {
  data: T | undefined
  error: unknown
  isLoading: boolean
  isFetching: boolean
  reload: () => void
}

// A saved answer, tagged with the request number it belongs to.
type StoredResult<T> = {
  requestId: number
  data: T | undefined
  error: unknown
}

// Same comparison React itself uses for dependency arrays.
function isSameDeps(a: readonly unknown[], b: readonly unknown[]) {
  return a.length === b.length && a.every((value, i) => Object.is(value, b[i]))
}

export function useApiQuery<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
  { keepPreviousData = false }: UseApiQueryOptions = {}
): UseApiQueryResult<T> {
  const [requestId, setRequestId] = useState(0)
  const [lastDeps, setLastDeps] = useState(deps)
  const [stored, setStored] = useState<StoredResult<T> | null>(null)

  // Step 1: when deps change, start a new request number.
  if (!isSameDeps(lastDeps, deps)) {
    setLastDeps(deps)
    setRequestId((id) => id + 1)
  }

  // Always call the newest fetcher, so callers don't need useCallback.
  const fetcherRef = useRef(fetcher)
  useEffect(() => {
    fetcherRef.current = fetcher
  })

  // Step 2: for each request number, fetch. Cancel the old request first.
  useEffect(() => {
    const controller = new AbortController()

    fetcherRef.current(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setStored({ requestId, data, error: null })
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        setStored((prev) => ({
          requestId,
          data: keepPreviousData ? prev?.data : undefined,
          error,
        }))
      }
    )

    return () => controller.abort()
  }, [requestId, keepPreviousData])

  const reload = useCallback(() => {
    setRequestId((id) => id + 1)
  }, [])

  // Step 3: is the saved answer for the current request number?
  const isCurrent = stored?.requestId === requestId

  return {
    data: isCurrent || keepPreviousData ? stored?.data : undefined,
    error: isCurrent ? (stored?.error ?? null) : null,
    isFetching: !isCurrent,
    isLoading: !isCurrent && (!keepPreviousData || stored?.data === undefined),
    reload,
  }
}
