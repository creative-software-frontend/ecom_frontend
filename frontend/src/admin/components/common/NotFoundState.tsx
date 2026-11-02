import { Link } from "react-router"

type NotFoundStateProps = {
  title: string
  backTo: string
  backLabel: string
  description?: string
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  linkClassName?: string
  titleElement?: "h1" | "p"
  titleContainerClassName?: string
}

export function NotFoundState({
  title,
  backTo,
  backLabel,
  description,
  className,
  titleClassName,
  descriptionClassName,
  linkClassName,
  titleElement = "p",
  titleContainerClassName,
}: NotFoundStateProps) {
  const Title = titleElement
  return (
    <div className={className}>
      {titleContainerClassName ? (
        <header className={titleContainerClassName}>
          <Title className={titleClassName}>{title}</Title>
          {description ? (
            <p className={descriptionClassName}>{description}</p>
          ) : null}
        </header>
      ) : null}
      {!titleContainerClassName ? (
        <>
          <Title className={titleClassName}>{title}</Title>
          {description ? (
            <p className={descriptionClassName}>{description}</p>
          ) : null}
        </>
      ) : null}
      <Link to={backTo} className={linkClassName}>
        {backLabel}
      </Link>
    </div>
  )
}
