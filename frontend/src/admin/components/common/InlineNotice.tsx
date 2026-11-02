import type { Ref } from "react"

type InlineNoticeProps = {
  message: string
  variant: "success" | "error"
  onDismiss: () => void
  className?: string
  dismissLabel: string
  dismissText?: string
  dismissClassName?: string
  ariaLive?: "polite" | "assertive"
  tabIndex?: number
  rootRef?: Ref<HTMLDivElement>
}

export function InlineNotice({
  message,
  variant,
  onDismiss,
  className,
  dismissLabel,
  dismissText = "✕",
  dismissClassName,
  ariaLive,
  tabIndex,
  rootRef,
}: InlineNoticeProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={ariaLive}
      className={className}
      tabIndex={tabIndex}
      ref={rootRef}
    >
      <span>{message}</span>
      <button
        type="button"
        aria-label={dismissLabel}
        onClick={onDismiss}
        className={dismissClassName}
      >
        {dismissText}
      </button>
    </div>
  )
}
