import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { createPortal } from "react-dom"
import DataTable, { type TableColumn } from "react-data-table-component"
import { MoreVertical, Pencil, KeyRound, Power, PowerOff } from "lucide-react"
import { adminDataTableStyles } from "../../lib/dataTableStyles"
import type { SuperAdminUser } from "../../types/superAdmin"
import { relativeTime } from "@/admin/lib/formatTime"

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("")
}

const roleBadgeClass: Record<string, string> = {
  super_admin: "bg-(--primary-soft) text-(--primary)",
  platform_manager: "bg-(--status-confirmed-bg) text-(--status-confirmed-text)",
  shop_admin: "bg-(--status-confirmed-bg) text-(--status-confirmed-text)",
  salesman: "bg-(--bg-table-header) text-(--text-muted)",
  order_handler: "bg-(--status-shipped-bg) text-(--status-shipped-text)",
  product_uploader: "bg-(--status-pending-bg) text-(--status-pending-text)",
}

type UsersTableProps = {
  items: SuperAdminUser[]
  isLoading: boolean
  page: number
  limit: number
  total: number
  onChangePage: (next: number) => void
  onChangeRowsPerPage: (next: number) => void
  onEdit: (user: SuperAdminUser) => void
  onResetPassword: (user: SuperAdminUser) => void
  onToggleStatus: (user: SuperAdminUser) => void
}

export function UsersTable({
  items,
  isLoading,
  page,
  limit,
  total,
  onChangePage,
  onChangeRowsPerPage,
  onEdit,
  onResetPassword,
  onToggleStatus,
}: UsersTableProps) {
  const [activeMenu, setActiveMenu] = useState<{
    user: SuperAdminUser
    anchor: HTMLButtonElement
  } | null>(null)
  const [menuPosition, setMenuPosition] = useState<{
    top: number
    left: number
    maxHeight: number
  } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const closeMenu = useCallback(() => {
    setActiveMenu(null)
    setMenuPosition(null)
  }, [])

  useEffect(() => {
    if (!activeMenu) return
    const currentMenu = activeMenu

    function handlePointerDown(event: PointerEvent) {
      const target = event.target
      if (
        target instanceof Node &&
        !currentMenu.anchor.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        closeMenu()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu()
        currentMenu.anchor.focus()
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [activeMenu, closeMenu])

  useLayoutEffect(() => {
    if (!activeMenu) return
    const currentMenu = activeMenu

    const menu = menuRef.current
    const anchor = currentMenu.anchor
    if (!menu || !anchor.isConnected) {
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
      const openAbove =
        spaceBelow < menuHeight && spaceAbove > spaceBelow
      const availableHeight = Math.max(
        0,
        openAbove ? spaceAbove : spaceBelow
      )
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

      setMenuPosition((current) =>
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
  }, [activeMenu, closeMenu])

  const columns: TableColumn<SuperAdminUser>[] = [
    {
      name: "Name",
      cell: (row) => (
        <div className="flex items-center gap-2.5 py-1">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--bg-table-header) text-[11px] font-semibold text-(--text-primary)">
            {initials(row.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-(--text-primary)">
              {row.name}
            </p>
            <p className="truncate text-[11px] text-(--text-muted)">
              {row.email}
            </p>
          </div>
        </div>
      ),
      minWidth: "220px",
      grow: 2,
    },
    {
      name: "Role",
      cell: (row) => {
        const cls =
          roleBadgeClass[row.role] ??
          "bg-(--bg-table-header) text-(--text-muted)"
        return (
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${cls}`}
          >
            {row.roleDisplayName}
          </span>
        )
      },
      width: "150px",
    },
    {
      name: "Shop",
      cell: (row) =>
        row.shop ? (
          <span className="text-[12px] text-(--text-primary)">
            {row.shop.name}
          </span>
        ) : (
          <span className="text-[12px] text-(--text-muted) italic">
            Platform
          </span>
        ),
      width: "160px",
    },
    {
      name: "Status",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ${
            row.status === "active"
              ? "bg-(--status-delivered-bg) text-(--status-delivered-text)"
              : "bg-(--bg-table-header) text-(--text-muted)"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${
              row.status === "active"
                ? "bg-(--status-delivered-text)"
                : "bg-(--text-muted)"
            }`}
          />
          {row.status === "active" ? "Active" : "Inactive"}
        </span>
      ),
      width: "110px",
    },
    {
      name: "Last login",
      cell: (row) => (
        <span className="text-[12px] text-(--text-muted) tabular-nums">
          {relativeTime(row.lastLoginAt)}
        </span>
      ),
      width: "120px",
    },
    {
      name: "",
      cell: (row) => (
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              if (activeMenu?.user.id === row.id) {
                closeMenu()
              } else {
                setMenuPosition(null)
                setActiveMenu({ user: row, anchor: e.currentTarget })
              }
            }}
            className="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-table-header) hover:text-(--text-primary)"
            aria-label={`Actions for ${row.name}`}
            aria-haspopup="menu"
            aria-expanded={activeMenu?.user.id === row.id}
            id={`user-actions-trigger-${row.id}`}
          >
            <MoreVertical className="size-4" />
          </button>
        </div>
      ),
      width: "56px",
      right: true,
    },
  ]

  return (
    <>
      <DataTable
        className="admin-data-table"
        // key forces remount when page changes so internal pagination syncs
        // with server state — RDT doesn't fully support controlled page prop.
        key={`users-page-${page}`}
        columns={columns}
        data={items}
        progressPending={isLoading}
        customStyles={adminDataTableStyles}
        pagination
        paginationServer
        paginationTotalRows={total}
        paginationDefaultPage={page}
        paginationPerPage={limit}
        paginationRowsPerPageOptions={[10, 20, 50, 100]}
        onChangePage={onChangePage}
        onChangeRowsPerPage={onChangeRowsPerPage}
        noDataComponent={
          <p className="py-10 text-center text-sm text-(--text-muted)">
            No users found.
          </p>
        }
      />
      {activeMenu &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-labelledby={`user-actions-trigger-${activeMenu.user.id}`}
            onClick={(event) => event.stopPropagation()}
            className="user-actions-menu w-44 rounded-md border border-(--border-light) bg-(--bg-surface) p-1 text-(--text-primary) shadow-lg"
            style={{
              top: menuPosition?.top ?? 0,
              left: menuPosition?.left ?? 0,
              maxHeight: menuPosition?.maxHeight,
              overflowY: "auto",
              visibility: menuPosition ? "visible" : "hidden",
            }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                closeMenu()
                onEdit(activeMenu.user)
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-(--bg-surface-hover)"
            >
              <Pencil className="size-3.5" /> Edit
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                closeMenu()
                onResetPassword(activeMenu.user)
              }}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-(--bg-surface-hover)"
            >
              <KeyRound className="size-3.5" /> Reset password
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                closeMenu()
                onToggleStatus(activeMenu.user)
              }}
              className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs transition-colors hover:bg-(--bg-surface-hover) ${
                activeMenu.user.status === "active"
                  ? "text-red-600"
                  : "text-(--primary)"
              }`}
            >
              {activeMenu.user.status === "active" ? (
                <>
                  <PowerOff className="size-3.5" /> Deactivate
                </>
              ) : (
                <>
                  <Power className="size-3.5" /> Activate
                </>
              )}
            </button>
          </div>,
          document.body
        )}
    </>
  )
}
