import type { ReactNode } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"
import { Key, Check } from "lucide-react"
import { FieldError } from "./SettingsField"

/* ================================================================
   MaskedTokenField — shows a masked placeholder when a token is
   already stored, with a "Replace" action that reveals a text input.
   Used for FB Conversions API token and TikTok Events API token.

   State ownership:
   - `editing` is local to the parent (per-field).
   - The input is a normal RHF-registered field (`register` prop).
   - When not editing, the input value stays as "" (empty) and the
     masked display is shown instead — so we never leak the token.
   ================================================================ */

type MaskedTokenFieldProps = {
  id: string
  label: string
  saved: boolean
  savedAt: string | null
  editing: boolean
  onReplace: () => void
  onCancel: () => void
  register: UseFormRegisterReturn
  error?: string
  help?: ReactNode
}

// Relative "last updated" hint for the header row.
function formatSavedAt(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return `Last updated ${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)}`
}

export function MaskedTokenField({
  id,
  label,
  saved,
  savedAt,
  editing,
  onReplace,
  onCancel,
  register,
  error,
  help,
}: MaskedTokenFieldProps) {
  const showMasked = saved && !editing

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-xs font-semibold tracking-wider text-(--text-muted) uppercase"
        >
          {label}
        </label>
        {savedAt && (
          <span className="shrink-0 text-xs text-(--text-muted)">
            {formatSavedAt(savedAt)}
          </span>
        )}
      </div>

      <div
        className={`flex h-9 items-center rounded-md border bg-(--bg-surface) pr-1.5 pl-3 ${
          error ? "border-red-300" : "border-(--border-light)"
        }`}
      >
        {showMasked ? (
          // Masked display — no real token value is ever rendered.
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Key className="size-3.5 shrink-0 text-(--text-muted)" />
            <span className="truncate font-mono text-sm tracking-widest text-(--text-muted)">
              ••••••••••••••••••••••••••••••••••••••••••••
            </span>
          </div>
        ) : (
          <input
            id={id}
            type="text"
            autoComplete="off"
            spellCheck={false}
            placeholder={saved ? "Paste the new token…" : "Paste the token…"}
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-(--text-primary) outline-none placeholder:text-(--text-muted)"
            {...register}
          />
        )}

        <div className="flex shrink-0 items-center gap-1.5">
          {showMasked && (
            <span className="inline-flex items-center gap-1 rounded-md bg-(--status-delivered-bg) px-2 py-0.5 text-xs font-medium text-(--status-delivered-text)">
              <Check className="size-3" />
              Token saved
            </span>
          )}
          {showMasked ? (
            <button
              type="button"
              onClick={onReplace}
              className="inline-flex h-7 items-center rounded border border-(--border-light) bg-(--bg-surface) px-2 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
            >
              Replace
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-7 items-center rounded border border-(--border-light) bg-(--bg-surface) px-2 text-xs font-medium text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary)"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {error && <FieldError>{error}</FieldError>}
      {!error && help && (
        <p className="mt-1 text-xs text-(--text-muted)">{help}</p>
      )}
    </div>
  )
}
