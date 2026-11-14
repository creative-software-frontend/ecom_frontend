import { Check, ShieldCheck } from "lucide-react"

/* ================================================================
   Modules / actions shown in the permission matrix.
   Backend accepts any combination — this list is the UI mirror.
   ================================================================ */

export const PERMISSION_MODULES = [
  { key: "products", label: "Products" },
  { key: "orders", label: "Orders" },
  { key: "settings", label: "Settings" },
  { key: "coupons", label: "Coupons" },
  { key: "pages", label: "Pages" },
  { key: "marketing", label: "Marketing" },
  { key: "courier", label: "Courier" },
  { key: "users", label: "Users" },
  { key: "roles", label: "Roles" },
  { key: "shops", label: "Shops" },
  { key: "audit", label: "Audit Log" },
] as const

const ACTIONS = [
  { key: "read", label: "Read" },
  { key: "create", label: "Create" },
  { key: "update", label: "Update" },
  { key: "delete", label: "Delete" },
] as const

type ActionKey = (typeof ACTIONS)[number]["key"]

type PermissionMatrixProps = {
  value: Record<string, string[]>
  onChange: (next: Record<string, string[]>) => void
  scope: "platform" | "shop"
  disabled?: boolean
}

export function PermissionMatrix({
  value,
  onChange,
  scope,
  disabled = false,
}: PermissionMatrixProps) {
  const accent = scope === "platform" ? "platform" : "shop"

  function has(module: string, action: ActionKey): boolean {
    return (value[module] ?? []).includes(action)
  }

  function toggleCell(module: string, action: ActionKey) {
    if (disabled) return
    const current = value[module] ?? []
    const next = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action]
    const newValue = { ...value }
    if (next.length === 0) delete newValue[module]
    else newValue[module] = next
    onChange(newValue)
  }

  function toggleModuleAll(module: string, checked: boolean) {
    if (disabled) return
    const newValue = { ...value }
    if (checked) {
      newValue[module] = ACTIONS.map((a) => a.key)
    } else {
      delete newValue[module]
    }
    onChange(newValue)
  }

  function toggleActionAll(action: ActionKey, checked: boolean) {
    if (disabled) return
    const newValue = { ...value }
    for (const m of PERMISSION_MODULES) {
      const current = newValue[m.key] ?? []
      if (checked) {
        newValue[m.key] = current.includes(action)
          ? current
          : [...current, action]
      } else {
        const filtered = current.filter((a) => a !== action)
        if (filtered.length === 0) delete newValue[m.key]
        else newValue[m.key] = filtered
      }
    }
    onChange(newValue)
  }

  const totalGrants = Object.values(value).reduce(
    (sum, arr) => sum + arr.length,
    0
  )
  const moduleCount = Object.keys(value).length
  const maxPossibleGrants = PERMISSION_MODULES.length * ACTIONS.length
  const isAllGranted = totalGrants === maxPossibleGrants

  function toggleGrantAll() {
    if (disabled) return
    if (isAllGranted) {
      // Clear all permissions
      onChange({})
    } else {
      // Grant all permissions across all modules
      const all: Record<string, string[]> = {}
      for (const m of PERMISSION_MODULES) {
        all[m.key] = ACTIONS.map((a) => a.key)
      }
      onChange(all)
    }
  }

  return (
    <div className="rounded-md border border-(--border-light) bg-(--bg-app)">
      <div className="flex items-center justify-between gap-2 border-b border-(--border-light) px-3 py-2">
        <div className="flex items-center gap-2">
          <ShieldCheck
            className={`size-4 transition-colors ${accent === "platform" ? "text-(--platform-primary)" : "text-primary"}`}
          />
          <span className="text-xs font-semibold text-(--text-primary)">
            Permissions
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all ${
              accent === "platform"
                ? "border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
                : "border border-blue-200 bg-blue-50 text-primary"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                accent === "platform"
                  ? "bg-indigo-600 dark:bg-indigo-400"
                  : "bg-primary"
              }`}
            />
            {accent === "platform"
              ? "Global Platform Mode"
              : "Shop Specific Mode"}
          </span>
        </div>
        <div className="flex items-center text-xs text-(--text-muted) tabular-nums">
          <button
            type="button"
            disabled={disabled}
            onClick={toggleGrantAll}
            className={`mr-2 inline-flex h-6 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isAllGranted
                ? "border border-(--border-light) bg-(--bg-surface) text-(--text-muted) hover:bg-(--bg-surface-hover) hover:text-(--text-primary)"
                : accent === "platform"
                  ? "bg-(--platform-primary) text-white hover:bg-(--platform-primary-hover)"
                  : "bg-primary text-white hover:bg-(--primary-hover)"
            }`}
          >
            {isAllGranted ? "Clear All" : "Select All"}
          </button>
          <div className="min-w-41.5 text-right">
            {totalGrants} {totalGrants === 1 ? "grant" : "grants"} across{" "}
            {moduleCount} {moduleCount === 1 ? "module" : "modules"}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs transition-all duration-200">
          <thead>
            <tr className="bg-(--bg-surface-hover)">
              <th className="border-b border-(--border-light) px-3 py-2 text-left font-semibold text-(--text-primary)">
                Module
              </th>
              {ACTIONS.map((a) => (
                <th
                  key={a.key}
                  className="border-b border-(--border-light) px-2 py-2 text-center font-semibold text-(--text-primary)"
                >
                  {a.label}
                </th>
              ))}
              <th className="border-b border-(--border-light) px-2 py-2 text-center font-semibold text-(--text-primary)">
                All
              </th>
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MODULES.map((m) => {
              const allChecked = ACTIONS.every((a) => has(m.key, a.key))
              return (
                <tr
                  key={m.key}
                  className="border-b border-(--border-light) last:border-0 hover:bg-(--bg-surface-hover)"
                >
                  <td className="px-3 py-1.5 text-(--text-primary)">
                    {m.label}
                  </td>
                  {ACTIONS.map((a) => (
                    <td
                      key={a.key}
                      className="px-2 py-1.5 text-center align-middle"
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={has(m.key, a.key)}
                        aria-label={`${m.label} ${a.label}`}
                        disabled={disabled}
                        onClick={() => toggleCell(m.key, a.key)}
                        className={`inline-flex size-5 items-center justify-center rounded border align-middle transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          has(m.key, a.key)
                            ? accent === "platform"
                              ? "border-(--platform-primary) bg-(--platform-primary) text-white hover:bg-(--platform-primary-hover)"
                              : "border-primary bg-primary text-white"
                            : accent === "platform"
                              ? "border-(--border-hover) bg-(--bg-surface) hover:border-(--platform-primary)"
                              : "border-(--border-hover) bg-(--bg-surface) hover:border-primary"
                        }`}
                      >
                        {has(m.key, a.key) && <Check className="size-3" />}
                      </button>
                    </td>
                  ))}
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={allChecked}
                      aria-label={`${m.label} all actions`}
                      disabled={disabled}
                      onClick={() => toggleModuleAll(m.key, !allChecked)}
                      className={`inline-flex h-5 items-center rounded border px-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        allChecked
                          ? accent === "platform"
                            ? "border-(--platform-primary) bg-(--platform-primary-soft) text-(--platform-primary)"
                            : "border-primary bg-(--primary-soft) text-primary"
                          : accent === "platform"
                            ? "border-(--border-hover) bg-(--bg-surface) text-(--text-muted) hover:border-(--platform-primary) hover:text-(--platform-primary)"
                            : "border-(--border-hover) bg-(--bg-surface) text-(--text-muted) hover:border-primary hover:text-(--text-primary)"
                      }`}
                    >
                      {allChecked ? "Clear" : "All"}
                    </button>
                  </td>
                </tr>
              )
            })}
            {/* Column "all" row */}
            <tr className="bg-(--bg-surface-hover)">
              <td className="px-3 py-1.5 text-xs font-semibold text-(--text-muted) uppercase">
                All modules
              </td>
              {ACTIONS.map((a) => {
                const allModulesChecked = PERMISSION_MODULES.every((m) =>
                  has(m.key, a.key)
                )
                return (
                  <td key={a.key} className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleActionAll(a.key, !allModulesChecked)}
                      className={`text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        allModulesChecked
                          ? accent === "platform"
                            ? "text-(--platform-primary)"
                            : "text-primary"
                          : accent === "platform"
                            ? "text-(--text-muted) hover:text-(--platform-primary)"
                            : "text-(--text-muted) hover:text-(--text-primary)"
                      }`}
                    >
                      {allModulesChecked ? "Clear" : "All"}
                    </button>
                  </td>
                )
              })}
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
