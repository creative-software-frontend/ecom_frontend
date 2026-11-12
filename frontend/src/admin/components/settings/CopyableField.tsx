import { useState } from "react"
import { Copy, Check } from "lucide-react"
import type { ReactNode } from "react"

/* ================================================================
   CopyableField — readonly input with a copy-to-clipboard button.
   Used for Pixel IDs, API keys, and any value the admin needs to
   paste into another tool. Timer auto-resets "Copied" feedback.
   ================================================================ */

type CopyableFieldProps = {
  label: string
  value: string
  hint?: ReactNode
  icon?: ReactNode
}

export function CopyableField({
  label,
  value,
  hint,
  icon,
}: CopyableFieldProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard unavailable (insecure context, permission denied) — silent fail.
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="text-xs font-semibold tracking-wider text-(--text-muted) uppercase">
          {label}
        </label>
        {hint && (
          <span className="shrink-0 text-xs text-(--text-muted)">
            {hint}
          </span>
        )}
      </div>
      <div className="flex h-9 items-center rounded-md border border-(--border-light) bg-(--bg-surface) pr-1.5 pl-3">
        {icon && (
          <span className="mr-2 shrink-0 text-(--text-muted)">{icon}</span>
        )}
        <input
          type="text"
          value={value}
          readOnly
          className="h-full min-w-0 flex-1 bg-transparent font-mono text-sm tracking-wide text-(--text-primary) outline-none"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-7 shrink-0 items-center gap-1 rounded px-2 text-xs font-medium text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary)"
          aria-label={`Copy ${label}`}
        >
          {copied ? (
            <>
              <Check className="size-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  )
}
