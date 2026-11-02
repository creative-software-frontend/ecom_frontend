import type { ReactNode } from "react"

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  wrapper?: boolean
  titleElement?: "p" | "span"
}

export function EmptyState({
  title,
  description,
  action,
  className,
  titleClassName,
  descriptionClassName,
  wrapper = true,
  titleElement = "p",
}: EmptyStateProps) {
  const Title = titleElement
  const content = (
    <>
      <Title className={titleClassName}>{title}</Title>
      {description ? (
        <p className={descriptionClassName}>{description}</p>
      ) : null}
      {action}
    </>
  )
  return wrapper ? <div className={className}>{content}</div> : content
}
