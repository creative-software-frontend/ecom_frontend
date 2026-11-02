import type { ReactNode } from "react"

type LoadingStateProps = {
  children: ReactNode
  className?: string
  ariaLabel?: string
  ariaLive?: "off" | "polite" | "assertive"
}

export function LoadingState({
  children,
  className,
  ariaLabel,
  ariaLive,
}: LoadingStateProps) {
  return (
    <div
      className={className}
      role="status"
      aria-label={ariaLabel}
      aria-live={ariaLive}
    >
      {children}
    </div>
  )
}
