import { useState, useMemo } from "react"
import { Plus, Download, Info } from "lucide-react"
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

const INITIAL_USERS: ShopUser[] = [
  {
    id: 1,
    name: "Abdur Razzaq",
    email: "superadmin@powerzenox.com",
    mobile: "+880 1711-002233",
    role: "shop_admin",
    roleDisplayName: "Shop Admin",
    status: "active",
    lastLoginAt: "14 mins ago",
  },
  {
    id: 2,
    name: "Fatema Khan",
    email: "fatema@powerzenox.com",
    mobile: "+880 1819-445566",
    role: "salesman",
    roleDisplayName: "Salesman",
    status: "active",
    lastLoginAt: "2 hours ago",
  },
  {
    id: 3,
    name: "Kazi Rahman",
    email: "kazi@powerzenox.com",
    mobile: "+880 1914-729102",
    role: "order_handler",
    roleDisplayName: "Order Handler",
    status: "active",
    lastLoginAt: "4 hours ago",
  },
  {
    id: 4,
    name: "Nusrat Jahan",
    email: "nusrat@powerzenox.com",
    mobile: "+880 1682-112233",
    role: "product_uploader",
    roleDisplayName: "Product Uploader",
    status: "inactive",
    lastLoginAt: "8 days ago",
  },
  {
    id: 5,
    name: "Tanvir Rahman",
    email: "tanvir@powerzenox.com",
    mobile: "+880 1521-778899",
    role: "salesman",
    roleDisplayName: "Salesman",
    status: "active",
    lastLoginAt: "Yesterday, 6:30 PM",
  },
  {
    id: 6,
    name: "Shamim Reza",
    email: "shamim@powerzenox.com",
    mobile: "+880 1301-224466",
    role: "order_handler",
    roleDisplayName: "Order Handler",
    status: "active",
    lastLoginAt: "May 18, 2024",
  },
]

const CURRENT_USER_ID = 1

export default function ShopUsersPage() {
  const [users, setUsers] = useState<ShopUser[]>(INITIAL_USERS)
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("all")
  const [status, setStatus] = useState("all")

  const [inviteOpen, setInviteOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<ShopUser | null>(null)
  const [userToReset, setUserToReset] = useState<ShopUser | null>(null)
  const [userToToggle, setUserToToggle] = useState<ShopUser | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase()
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.mobile.includes(q)
      const matchesRole = role === "all" || u.role === role
      const matchesStatus = status === "all" || u.status === status
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, search, role, status])

  const activeCount = users.filter((u) => u.status === "active").length
  const inactiveCount = users.length - activeCount

  function handleCreate(newUser: ShopUser) {
    setUsers((prev) => [...prev, newUser])
    setSuccessMessage(`${newUser.name} was added to your team.`)
  }

  function handleUpdate(updated: ShopUser) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    setSuccessMessage(`${updated.name} was updated.`)
  }

  function handleResetPassword(target: ShopUser) {
    setSuccessMessage(`Password reset for ${target.name}.`)
  }

  function handleToggleConfirm() {
    if (!userToToggle) return
    const next: ShopUser["status"] =
      userToToggle.status === "active" ? "inactive" : "active"
    setUsers((prev) =>
      prev.map((u) => (u.id === userToToggle.id ? { ...u, status: next } : u))
    )
    setSuccessMessage(
      `${userToToggle.name} was ${next === "active" ? "activated" : "deactivated"}.`
    )
    setUserToToggle(null)
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
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover)">
            <Download className="size-4" /> Export
          </button>
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-(--primary) px-4 text-sm font-medium text-white hover:bg-(--primary-hover)"
          >
            <Plus className="size-4" /> Add User
          </button>
        </div>
      </div>

      <ShopUsersMetricsCards
        total={users.length}
        active={activeCount}
        inactive={inactiveCount}
      />

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-(--status-delivered-bg) bg-(--status-delivered-bg)/50 px-4 py-2.5 text-sm text-(--status-delivered-text)"
        >
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
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
        />
        <ShopUsersTable
          users={filteredUsers}
          currentUserId={CURRENT_USER_ID}
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

      {/* Modals */}
      <InviteShopUserModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSuccess={handleCreate}
      />
      <EditShopUserDrawer
        open={userToEdit !== null}
        user={userToEdit}
        currentUserId={CURRENT_USER_ID}
        onClose={() => setUserToEdit(null)}
        onSuccess={handleUpdate}
      />
      <ResetShopUserPasswordModal
        open={userToReset !== null}
        user={userToReset}
        onClose={() => setUserToReset(null)}
        onSuccess={handleResetPassword}
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
        onCancel={() => setUserToToggle(null)}
        onConfirm={handleToggleConfirm}
      />
    </div>
  )
}
