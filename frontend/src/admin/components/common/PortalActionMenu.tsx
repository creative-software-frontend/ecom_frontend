import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"

type PortalActionMenuProps = {
  label: string
  trigger: ReactNode
  triggerClassName?: string
  menuClassName?: string
  children: (closeMenu: () => void) => ReactNode
}

export function PortalActionMenu({
  label,
  trigger,
  triggerClassName,
  menuClassName = "w-44",
  children,
}: PortalActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<{
    top: number
    left: number
    maxHeight: number
  } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const closeMenu = useCallback(() => {
    setIsOpen(false)
    setPosition(null)
  }, [])

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target
      if (
        target instanceof Node &&
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        closeMenu()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu()
        triggerRef.current?.focus()
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, closeMenu])

  useLayoutEffect(() => {
    if (!isOpen) return

    const menu = menuRef.current
    const anchor = triggerRef.current
    if (!menu || !anchor?.isConnected) {
      closeMenu()
      return
    }

    const updatePosition = () => {
      if (!anchor.isConnected) {
        closeMenu()
        return
      }

      const anchorRect = anchor.getBoundingClientRect()
      const menuRect = menu.getBoundingClientRect()
      const menuHeight = menu.scrollHeight
      const margin = 8
      const gap = 4
      const spaceAbove = anchorRect.top - gap - margin
      const spaceBelow = window.innerHeight - anchorRect.bottom - gap - margin
      const openAbove = spaceBelow < menuHeight && spaceAbove > spaceBelow
      const availableHeight = Math.max(0, openAbove ? spaceAbove : spaceBelow)
      const height = Math.min(menuHeight, availableHeight)
      const top = openAbove
        ? anchorRect.top - gap - height
        : anchorRect.bottom + gap
      const left = Math.max(
        margin,
        Math.min(
          anchorRect.right - menuRect.width,
          window.innerWidth - menuRect.width - margin
        )
      )

      setPosition((current) =>
        current?.top === top &&
        current.left === left &&
        current.maxHeight === availableHeight
          ? current
          : { top, left, maxHeight: availableHeight }
      )

      const themeRoot = anchor.closest(".admin-root") ?? anchor
      const theme = window.getComputedStyle(themeRoot)
      for (const token of [
        "--bg-surface",
        "--bg-surface-hover",
        "--border-light",
        "--text-primary",
        "--text-muted",
        "--primary",
      ]) {
        const value = theme.getPropertyValue(token).trim()
        if (value) menu.style.setProperty(token, value)
      }
      menu.style.fontFamily = theme.fontFamily
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [isOpen, closeMenu])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          if (isOpen) {
            closeMenu()
          } else {
            setPosition(null)
            setIsOpen(true)
          }
        }}
        className={triggerClassName}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
      >
        {trigger}
      </button>
      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            onClick={(event) => event.stopPropagation()}
            className={`admin-portal-menu rounded-md border border-(--border-light) bg-(--bg-surface) p-1 text-(--text-primary) shadow-lg ${menuClassName}`}
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              maxHeight: position?.maxHeight,
              overflowY: "auto",
              visibility: position ? "visible" : "hidden",
            }}
          >
            {children(closeMenu)}
          </div>,
          document.body
        )}
    </>
  )
}
