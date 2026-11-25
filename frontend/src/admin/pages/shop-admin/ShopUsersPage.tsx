import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Download, Info, Plus } from "lucide-react"
import { useAuth } from "../../auth/AuthProvider"
import { ApiError } from "../../api/client"
import { shopUsersApi, shopUserQueryKeys } from "../../api/shopUsersApi"
import { ShopUsersMetricsCards } from "../../components/shop-admin/ShopUsersMetricsCards"
import { ShopUsersToolbar } from "../../components/shop-admin/ShopUsersToolbar"
import {
  ShopUsersTable,
  type ShopUser,
} from "../../components/shop-admin/ShopUsersTable"
import { InviteShopUserModal } from "../../components/shop-admin/InviteShopUserModal"
import { EditShopUserDrawer } from "../../components/shop-admin/EditShopUserDrawer"
import { ResetShopUserPasswordModal } from "../../components/shop-admin/ResetShopUserPasswordModal"
import { ConfirmationDialog } from "../../components/common/ConfirmationDialog"
import { ErrorState } from "../../components/common/ErrorState"
import { LoadingState } from "../../components/common/LoadingState"
import { InlineNotice } from "../../components/common/InlineNotice"

type Notice = { tone: "success" | "error"; message: string } | null

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function downloadUsersCsv(users: ShopUser[]) {
  const headers = ["Name", "Email", "Mobile", "Role", "Status", "Last Active"]
  const rows = users.map((user) => [
    user.name,
    user.email,
    user.mobile,
    user.roleDisplayName,
    user.status,
    user.lastLoginAt ?? "",
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `shop-users-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function ShopUsersPage() {
  const { state } = useAuth()
  const queryClient = useQueryClient()
  const currentUserId = state.status === "authenticated" ? state.user.id : 0
  const usersQuery = useQuery({
    queryKey: shopUserQueryKeys.list(),
    queryFn: ({ signal }) => shopUsersApi.list(signal),
  })
  const rolesQuery = useQuery({
    queryKey: shopUserQueryKeys.roles(),
    queryFn: ({ signal }) => shopUsersApi.listRoles(signal),
  })

  const [search, setSearch] = useState("")
  const [role, setRole] = useState("all")
  const [status, setStatus] = useState("all")
  const [inviteOpen, setInviteOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<ShopUser | null>(null)
  const [userToReset, setUserToReset] = useState<ShopUser | null>(null)
  const [userToToggle, setUserToToggle] = useState<ShopUser | null>(null)
  const [notice, setNotice] = useState<Notice>(null)

  const users = usersQuery.data?.items ?? []
  const roles = rolesQuery.data ?? []
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter(
      (user) =>
        (!q ||
          user.name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          user.mobile.toLowerCase().includes(q)) &&
        (role === "all" || user.role === role) &&
        (status === "all" || user.status === status)
    )
  }, [users, search, role, status])

  const toggleMutation = useMutation({
    mutationFn: (user: ShopUser) =>
      shopUsersApi.update(user.id, {
        status: user.status === "active" ? "inactive" : "active",
      }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: shopUserQueryKeys.all })
      setUserToToggle(null)
      setNotice({
        tone: "success",
        message: `${updated.name} was ${updated.status === "active" ? "activated" : "deactivated"}.`,
      })
    },
    onError: (error) => {
      setUserToToggle(null)
      setNotice({
        tone: "error",
        message:
          error instanceof ApiError
            ? error.message
            : "Could not change user status.",
      })
    },
  })

  const handleMutationSuccess = (message: string) =>
    setNotice({ tone: "success", message })
  const isLoading = usersQuery.isLoading || rolesQuery.isLoading
  const queryError = usersQuery.error ?? rolesQuery.error

  if (isLoading) {
    return (
      <LoadingState
        className="flex min-h-64 items-center justify-center text-sm text-(--text-muted)"
        ariaLabel="Loading shop users"
      >
        Loading users...
      </LoadingState>
    )
  }
  if (queryError) {
    const permissionError =
      queryError instanceof ApiError && queryError.status === 403
    return (
      <ErrorState
        className="m-6 rounded-md border border-(--border-light) bg-(--bg-surface) p-6 text-center"
        messageClassName="mb-3 text-sm text-(--text-muted)"
        buttonClassName="h-8 rounded-md bg-(--primary) px-3 text-sm font-medium text-white"
        message={
          permissionError
            ? "Only shop administrators can manage shop staff."
            : queryError instanceof Error
              ? queryError.message
              : "Could not load shop users."
        }
        onRetry={() => {
          void usersQuery.refetch()
          void rolesQuery.refetch()
        }}
      />
    )
  }

  const counts = usersQuery.data?.counts ?? {
    total: users.length,
    active: 0,
    inactive: 0,
  }
  return (
    <div className="min-w-0 space-y-4 bg-(--bg-app) p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-(--text-primary)">Users</h1>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            Manage store staff, roles, and access permissions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadUsersCsv(filteredUsers)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover)"
          >
            <Download className="size-4" /> Export
          </button>
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-sm font-medium text-white hover:bg-(--primary-hover)"
          >
            <Plus className="size-4" /> Add User
          </button>
        </div>
      </div>
      <ShopUsersMetricsCards
        total={counts.total}
        active={counts.active}
        inactive={counts.inactive}
      />
      {notice && (
        <InlineNotice
          message={notice.message}
          variant={notice.tone}
          ariaLive={notice.tone === "error" ? "assertive" : "polite"}
          dismissLabel="Dismiss notification"
          onDismiss={() => setNotice(null)}
          className={
            notice.tone === "error"
              ? "flex items-center justify-between gap-3 rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-4 py-2.5 text-sm text-(--status-cancelled-text)"
              : "flex items-center justify-between gap-3 rounded-md border border-(--status-delivered-bg) bg-(--status-delivered-bg)/50 px-4 py-2.5 text-sm text-(--status-delivered-text)"
          }
        />
      )}
      <section className="overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface)">
        <ShopUsersToolbar
          search={search}
          onSearchChange={setSearch}
          role={role}
          onRoleChange={setRole}
          status={status}
          onStatusChange={setStatus}
          totalCount={filteredUsers.length}
          roles={roles}
        />
        <ShopUsersTable
          users={filteredUsers}
          currentUserId={currentUserId}
          onEdit={setUserToEdit}
          onResetPassword={setUserToReset}
          onToggleStatus={setUserToToggle}
        />
      </section>
      <div className="flex items-start gap-2 rounded-md border border-(--border-light) bg-(--bg-app) p-3 text-[11px] leading-relaxed text-(--text-muted)">
        <Info className="mt-0.5 size-4 shrink-0 text-(--primary)" />
        <p>
          Shop administrators can manage permissions and staff credentials for
          this store node. Super admin access and global role definitions remain
          managed at the platform level.
        </p>
      </div>
      <InviteShopUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        roles={roles}
        onSuccess={(user) =>
          handleMutationSuccess(`${user.name} was added to your team.`)
        }
      />
      <EditShopUserDrawer
        open={userToEdit !== null}
        user={userToEdit}
        currentUserId={currentUserId}
        roles={roles}
        onClose={() => setUserToEdit(null)}
        onSuccess={(user) => handleMutationSuccess(`${user.name} was updated.`)}
      />
      <ResetShopUserPasswordModal
        open={userToReset !== null}
        user={userToReset}
        onClose={() => setUserToReset(null)}
        onSuccess={(user) =>
          handleMutationSuccess(`Password reset for ${user.name}.`)
        }
      />
      <ConfirmationDialog
        open={userToToggle !== null}
        title={
          userToToggle?.status === "active"
            ? "Deactivate User?"
            : "Activate User?"
        }
        description={
          <>
            Are you sure you want to{" "}
            {userToToggle?.status === "active" ? "deactivate" : "activate"}{" "}
            <strong>{userToToggle?.name}</strong>?
          </>
        }
        confirmLabel={
          userToToggle?.status === "active" ? "Deactivate" : "Activate"
        }
        variant={userToToggle?.status === "active" ? "danger" : "success"}
        isPending={toggleMutation.isPending}
        errorMessage={null}
        onCancel={() => setUserToToggle(null)}
        onConfirm={() => userToToggle && toggleMutation.mutate(userToToggle)}
      />
    </div>
  )
}
