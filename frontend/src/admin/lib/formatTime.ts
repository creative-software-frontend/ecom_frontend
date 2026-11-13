const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

const LONG_DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
})

const TIMESTAMP_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
})

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/** Short date, e.g. "13 Nov 2026". */
export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value)
  return date ? DATE_FORMAT.format(date) : "N/A"
}

/** Long date, e.g. "November 13, 2026". */
export function formatLongDate(
  value: string | Date | null | undefined
): string {
  const date = toDate(value)
  return date ? LONG_DATE_FORMAT.format(date) : "N/A"
}

/** Date + time, e.g. "13 Nov, 14:30". */
export function formatTimestamp(iso: string | null | undefined): string {
  const date = toDate(iso)
  return date ? TIMESTAMP_FORMAT.format(date) : "—"
}

/**
 * Human-friendly elapsed time, e.g. "5m ago", "3d ago", "2mo ago".
 * Returns "Never" for a missing value and "—" for an invalid date.
 */
export function relativeTime(iso: string | null): string {
  if (!iso) return "Never"
  const date = toDate(iso)
  if (!date) return "—"

  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}
