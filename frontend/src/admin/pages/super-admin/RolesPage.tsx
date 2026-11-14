import { useMemo, useState } from "react"
import { CheckCircle2, X, Download, Plus } from "lucide-react"
import { RolesToolbar } from "../../components/super-admin/RolesToolbar"
import { RolesTable } from "../../components/super-admin/RolesTable"
import { RolesMetricsCards } from "../../components/super-admin/RolesMetricsCards"
import { PermissionMatrixQuickGlance } from "../../components/super-admin/PermissionMatrixQuickGlance"
import { CreateRoleModal } from "../../components/super-admin/CreateRoleModal"
import { EditRoleDrawer } from "../../components/super-admin/EditRoleDrawer"
import { DeleteRoleDialog } from "../../components/super-admin/DeleteRoleDialog"
import {
  useAdminRolesList,
  useDeleteRoleMutation,
} from "../../hooks/useAdminUsers"
import { getErrorMessage } from "../../lib/errors"
import type { SuperAdminRole } from "../../types/superAdmin"

export default function RolesPage() {
  const [search, setSearch] = useState("")
  const { data: roles = [], isLoading } = useAdminRolesList()
  const deleteMutation = useDeleteRoleMutation()

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roles
    return roles.filter(
      (r) =>
        r.displayName.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q)
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
        setDeleteError(getErrorMessage(err, "Failed to delete role"))
      },
    })
  }

  return (
    <div className="min-w-0 space-y-4 bg-(--bg-app) p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-(--text-primary)">
              Roles & Permissions
            </h1>
            {!isLoading && (
              <span className="rounded bg-(--bg-table-header) px-2 py-0.5 text-xs font-medium text-(--text-muted)">
                {roles.length} Configured
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            Define what each role can do across every module.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover)">
            <Download className="size-4" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover)"
          >
            <Plus className="size-3.5" /> Create Role
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-(--status-delivered-bg) bg-(--status-delivered-bg)/50 px-4 py-2.5 text-sm text-(--status-delivered-text)">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" /> {successMessage}
          </span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="rounded p-1 hover:bg-(--status-delivered-bg)"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Metrics */}
      {!isLoading && <RolesMetricsCards roles={roles} />}

      {/* Table Area */}
      <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
        <RolesToolbar search={search} onSearchChange={setSearch} />
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

      {/* Quick Glance Section */}
      {!isLoading && <PermissionMatrixQuickGlance />}

      {/* Modals */}
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
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
