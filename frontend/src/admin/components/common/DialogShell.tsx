import type { ReactNode } from "react"
import { X } from "lucide-react"

type DialogPlacement = "modal" | "drawer"

const overlayClassNames: Record<DialogPlacement, string> = {
  modal: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4",
  drawer: "fixed inset-0 z-50 flex justify-end bg-black/40",
}

const panelClassNames: Record<DialogPlacement, string> = {
  modal:
    "flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface) shadow-xl",
  drawer:
    "flex h-full w-full max-w-md flex-col border-l border-(--border-light) bg-(--bg-surface) shadow-xl",
}

const headerClassName =
  "flex items-center justify-between gap-3 border-b border-(--border-light) px-5 py-3"
const iconClassName =
  "flex size-7 items-center justify-center rounded-md bg-(--primary-soft) text-(--primary)"
const closeButtonClassName =
  "rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary) disabled:opacity-50"

export type DialogShellProps = {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  /** id for the title element; pass it when a dialog needs aria-labelledby. */
  titleId?: string
  placement?: DialogPlacement
  /** Escape hatches for dialogs with a different size or visual accent. */
  overlayClassName?: string
  panelClassName?: string
  headerClassName?: string
  iconClassName?: string
  closeButtonClassName?: string
  closeDisabled?: boolean
  onClose: () => void
  children: ReactNode
}

/**
 * Shared overlay, panel and header for admin create/edit dialogs.
 * The caller owns the `<form>` (body + footer) so validation and submit
 * behaviour stay where they are; this only removes the repeated shell.
 */
export function DialogShell({
  title,
  subtitle,
  icon,
  titleId,
  placement = "modal",
  overlayClassName,
  panelClassName,
  headerClassName: customHeaderClassName,
  iconClassName: customIconClassName,
  closeButtonClassName: customCloseButtonClassName,
  closeDisabled = false,
  onClose,
  children,
}: DialogShellProps) {
  const heading = (
    <h2 id={titleId} className="text-sm font-semibold text-(--text-primary)">
      {title}
    </h2>
  )

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={overlayClassName ?? overlayClassNames[placement]}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={panelClassName ?? panelClassNames[placement]}
      >
        <div className={customHeaderClassName ?? headerClassName}>
          <div className="flex items-center gap-2">
            {icon && (
              <span className={customIconClassName ?? iconClassName}>
                {icon}
              </span>
            )}
            {subtitle ? (
              <div>
                {heading}
                {subtitle}
              </div>
            ) : (
              heading
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            className={customCloseButtonClassName ?? closeButtonClassName}
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
