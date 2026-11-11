import { useState } from "react"
import { useDebouncedValue } from "../../hooks/useDebouncedValue"
import { UsersToolbar } from "../../components/super-admin/UsersToolbar"
import { UsersTable } from "../../components/super-admin/UsersTable"
import { useAdminUsersList, useAdminRolesList } from "../../hooks/useAdminUsers"
import type { SuperAdminUser } from "../../types/superAdmin"

const DEFAULT_LIMIT = 20

export default function UsersPage() {
  const [search, setSearch] = useState("")
  const [roleId, setRoleId] = useState<number | undefined>()
  const [status, setStatus] = useState<"active" | "inactive" | undefined>()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(DEFAULT_LIMIT)

  // Debounce search to avoid hammering the API on every keystroke.
  const debouncedSearch = useDebouncedValue(search, 300)

  const { data, isLoading } = useAdminUsersList({
    page,
    limit,
    q: debouncedSearch.trim() || undefined,
    roleId,
    status,
  })
  const { data: roles = [] } = useAdminRolesList()

  function handleInvite() {
    // Wired in Part 4c
    alert("Invite user modal — Part 4c")
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleEdit(_user: SuperAdminUser) {
    alert("Edit user modal — Part 4c")
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleResetPassword(_user: SuperAdminUser) {
    alert("Reset password modal — Part 4c")
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleToggleStatus(_user: SuperAdminUser) {
    alert("Toggle status — Part 4c")
  }

  return (
    <div className="min-w-0 space-y-4 bg-(--bg-app) p-4 sm:p-6">
      <header>
        <h1 className="text-[20px] font-semibold text-(--text-primary)">
          Admin Users
        </h1>
        <p className="mt-0.5 text-[13px] text-(--text-muted)">
          Manage panel access, roles, and account statuses across the platform.
        </p>
      </header>

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
          status={status}
          onStatusChange={(v) => {
            setStatus(v)
            setPage(1)
          }}
          roles={roles}
          onInvite={handleInvite}
        />
        <UsersTable
          items={data?.items ?? []}
          isLoading={isLoading}
          page={page}
          limit={limit}
          total={data?.total ?? 0}
          onChangePage={setPage}
          onChangeRowsPerPage={(n) => {
            setLimit(n)
            setPage(1)
          }}
          onEdit={handleEdit}
          onResetPassword={handleResetPassword}
          onToggleStatus={handleToggleStatus}
        />
      </section>
    </div>
  )
}
