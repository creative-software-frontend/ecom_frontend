type QueryParamValue = string | number | boolean | null | undefined

/**
 * Shared URLSearchParams builder for list endpoints. `undefined`, `null` and
 * empty strings are omitted so optional filters never leak into the URL.
 */
export function buildQueryString(
  params: Record<string, QueryParamValue>
): string {
  const query = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    query.set(key, String(value))
  }

  return query.toString()
}

export function withQuery(path: string, queryString: string): string {
  return queryString ? `${path}?${queryString}` : path
}
