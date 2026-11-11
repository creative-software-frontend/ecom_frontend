import { useMemo, useState } from "react"
import { CheckCircle2, X } from "lucide-react"
import { RolesToolbar } from "../../components/super-admin/RolesToolbar"
import { RolesTable } from "../../components/super-admin/RolesTable"
import { CreateRoleModal } from "../../components/super-admin/CreateRoleModal"
import { EditRoleDrawer } from "../../components/super-admin/EditRoleDrawer"
import { DeleteRoleDialog } from "../../components/super-admin/DeleteRoleDialog"
import {
  useAdminRolesList,
  useDeleteRoleMutation,
} from "../../hooks/useAdminUsers"
import { ApiError } from "../../api/client"
import type { SuperAdminRole } from "../../types/superAdmin"

export default function RolesPage() {
  const [search, setSearch] = useState("")
  const { data: roles = [], isLoading } = useAdminRolesList()
  const deleteMutation = useDeleteRoleMutation()

  // Client-side filter — role list is small and not paginated by backend.
  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roles
    return roles.filter(
      (r) =>
        r.displayName.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    )
  }, [roles, search])

  const [createOpen, setCreateOpen] = useState(false)
  const [editRole, setEditRole] = useState<SuperAdminRole | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<SuperAdminRole | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    setDeleteError(null)
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setSuccessMessage(`Role "${deleteTarget.displayName}" deleted.`)
        setDeleteTarget(null)
      },
      onError: (err) => {
        setDeleteError(
          err instanceof ApiError ? err.message : "Failed to delete role"
        )
      },
    })
  }

  return (
    <div className="min-w-0 space-y-4 bg-(--bg-app) p-4 sm:p-6">
      <header>
        <h1 className="text-[20px] font-semibold text-(--text-primary)">
          Roles & Permissions
        </h1>
        <p className="mt-0.5 text-[13px] text-(--text-muted)">
          Define what each role can do across every module. Changes take effect
          immediately for all users with that role.
        </p>
      </header>

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-(--status-delivered-bg) bg-(--status-delivered-bg)/50 px-4 py-2.5 text-[13px] text-(--status-delivered-text)"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            {successMessage}
          </span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="rounded p-1 hover:bg-(--status-delivered-bg)"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
        <RolesToolbar
          search={search}
          onSearchChange={setSearch}
          onAdd={() => setCreateOpen(true)}
        />
        <RolesTable
          items={filteredRoles}
          isLoading={isLoading}
          onEdit={(r) => setEditRole(r)}
          onDelete={(r) => {
            setDeleteTarget(r)
            setDeleteError(null)
          }}
        />
      </section>

      <CreateRoleModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(msg) => setSuccessMessage(msg)}
      />
      <EditRoleDrawer
        open={editRole !== null}
        role={editRole}
        onClose={() => setEditRole(null)}
        onSuccess={(msg) => setSuccessMessage(msg)}
      />
      <DeleteRoleDialog
        open={deleteTarget !== null}
        roleName={deleteTarget?.displayName ?? ""}
        userCount={deleteTarget?.userCount ?? 0}
        isPending={deleteMutation.isPending}
        errorMessage={deleteError}
        onCancel={() => {
          setDeleteTarget(null)
          setDeleteError(null)
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
