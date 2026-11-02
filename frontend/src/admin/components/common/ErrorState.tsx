import type { ReactNode } from "react"
import { Link } from "react-router"

type ErrorStateProps = {
  message: ReactNode
  onRetry: () => void
  className?: string
  messageClassName?: string
  buttonClassName?: string
  role?: "alert" | "status"
  retryLabel?: string
  wrapMessage?: boolean
  backLink?: { to: string; label: string; className?: string }
}

export function ErrorState({
  message,
  onRetry,
  className,
  messageClassName,
  buttonClassName,
  role,
  retryLabel = "Retry",
  wrapMessage = true,
  backLink,
}: ErrorStateProps) {
  return (
    <div className={className} role={role}>
      {wrapMessage ? (
        <p className={messageClassName}>{message}</p>
      ) : (
        message
      )}
      <button type="button" onClick={onRetry} className={buttonClassName}>
        {retryLabel}
      </button>
      {backLink ? (
        <Link to={backLink.to} className={backLink.className}>
          {backLink.label}
        </Link>
      ) : null}
    </div>
  )
}
