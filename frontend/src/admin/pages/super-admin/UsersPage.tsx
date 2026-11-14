import { useState } from "react"
import { CheckCircle2, X, Download, UserPlus } from "lucide-react"
import { useDebouncedValue } from "../../hooks/useDebouncedValue"
import { UsersToolbar } from "../../components/super-admin/UsersToolbar"
import { UsersTable } from "../../components/super-admin/UsersTable"
import { UsersMetricsCards } from "../../components/super-admin/UsersMetricsCards"
import { InviteUserModal } from "../../components/super-admin/InviteUserModal"
import { EditUserDrawer } from "../../components/super-admin/EditUserDrawer"
import { ResetPasswordModal } from "../../components/super-admin/ResetPasswordModal"
import { ConfirmToggleStatusDialog } from "../../components/super-admin/ConfirmToggleStatusDialog"
import {
  useAdminUsersList,
  useAdminRolesList,
  useAdminShopsList,
  useUpdateAdminUserMutation,
} from "../../hooks/useAdminUsers"
import { useAuth } from "../../auth/AuthProvider"
import { getErrorMessage } from "../../lib/errors"
import type { SuperAdminUser } from "../../types/superAdmin"

const DEFAULT_LIMIT = 10

export default function UsersPage() {
  const { state: authState } = useAuth()
  const currentUserId =
    authState.status === "authenticated" ? authState.user.id : 0

  const [search, setSearch] = useState("")
  const [roleId, setRoleId] = useState<number | undefined>()
  const [shopId, setShopId] = useState<number | undefined>()
  const [status, setStatus] = useState<"active" | "inactive" | undefined>()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)

  const debouncedSearch = useDebouncedValue(search, 300)

  const { data, isLoading } = useAdminUsersList({
    page,
    limit,
    q: debouncedSearch.trim() || undefined,
    roleId,
    shopId,
    status,
  })
  const { data: roles = [] } = useAdminRolesList()
  const { data: shops = [] } = useAdminShopsList()
  const updateMutation = useUpdateAdminUserMutation()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [editUser, setEditUser] = useState<SuperAdminUser | null>(null)
  const [resetPwUser, setResetPwUser] = useState<SuperAdminUser | null>(null)
  const [toggleTarget, setToggleTarget] = useState<SuperAdminUser | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function handleToggleConfirm() {
    if (!toggleTarget) return
    const next = toggleTarget.status === "active" ? "inactive" : "active"
    setToggleError(null)
    updateMutation.mutate(
      { id: toggleTarget.id, data: { status: next } },
      {
        onSuccess: () => {
          setSuccessMessage(
            `${toggleTarget.name} ${next === "active" ? "activated" : "deactivated"}.`
          )
          setToggleTarget(null)
        },
        onError: (err) => setToggleError(getErrorMessage(err)),
      }
    )
  }

  function resetFilters() {
    setSearch("")
    setRoleId(undefined)
    setShopId(undefined)
    setStatus(undefined)
    setPage(1)
  }

  return (
    <div className="min-w-0 space-y-4 bg-(--bg-app) p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-(--text-primary)">
            Admin Users
          </h1>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            Manage panel access, roles, and account statuses across the
            platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover)">
            <Download className="size-4" /> Export CSV
          </button>
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-(--primary-hover)"
          >
            <UserPlus className="size-4" /> Add User
          </button>
        </div>
      </div>

      {/* Metrics */}
      <UsersMetricsCards totalUsers={data?.total || 0} />

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-(--status-delivered-bg) bg-(--status-delivered-bg)/50 px-4 py-2.5 text-sm text-(--status-delivered-text)"
        >
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

      {/* Table Area */}
      <section className="overflow-hidden rounded-lg border border-(--border-light) bg-(--bg-surface)">
        <UsersToolbar
          search={search}
          onSearchChange={(v) => {
            setSearch(v)
            setPage(1)
          }}
          roleId={roleId}
          onRoleChange={(v) => {
            setRoleId(v)
            setPage(1)
          }}
          shopId={shopId}
          onShopChange={(v) => {
            setShopId(v)
            setPage(1)
          }}
          status={status}
          onStatusChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          roles={roles}
          shops={shops}
          totalCount={data?.total || 0}
          onInvite={() => setInviteOpen(true)}
          onClearFilters={resetFilters}
        />
        <UsersTable
          items={data?.items ?? []}
          isLoading={isLoading}
          page={page}
          limit={limit}
          total={data?.total ?? 0}
          currentUserId={currentUserId}
          onChangePage={setPage}
          onChangeRowsPerPage={(n) => {
            setLimit(n)
            setPage(1)
          }}
          onEdit={(u) => setEditUser(u)}
          onResetPassword={(u) => setResetPwUser(u)}
          onToggleStatus={(u) => {
            setToggleTarget(u)
            setToggleError(null)
          }}
        />
      </section>

      {/* Modals */}
      <InviteUserModal
        open={inviteOpen}
        roles={roles}
        shops={shops}
        onClose={() => setInviteOpen(false)}
        onSuccess={(msg) => setSuccessMessage(msg)}
      />
      <EditUserDrawer
        open={editUser !== null}
        user={editUser}
        roles={roles}
        shops={shops}
        currentUserId={currentUserId}
        onClose={() => setEditUser(null)}
        onSuccess={(msg) => setSuccessMessage(msg)}
      />
      <ResetPasswordModal
        open={resetPwUser !== null}
        user={resetPwUser}
        onClose={() => setResetPwUser(null)}
        // onSuccess={(msg) => setSuccessMessage(msg)}
      />
      <ConfirmToggleStatusDialog
        open={toggleTarget !== null}
        userName={toggleTarget?.name ?? ""}
        nextStatus={toggleTarget?.status === "active" ? "inactive" : "active"}
        isPending={updateMutation.isPending}
        errorMessage={toggleError}
        onCancel={() => {
          setToggleTarget(null)
          setToggleError(null)
        }}
        onConfirm={handleToggleConfirm}
      />
    </div>
  )
}
