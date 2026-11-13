/**
 * Extracts a user-facing message from an unknown thrown value.
 * Keeps the actual API/server message when one is available.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred."
): string {
  if (error instanceof Error && error.message) return error.message
  return fallback
}
