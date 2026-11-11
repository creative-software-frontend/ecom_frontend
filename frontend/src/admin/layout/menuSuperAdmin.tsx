import type { MenuItem } from "./menu"

export const superAdminMenu: MenuItem[] = [
  { type: "section", label: "Platform" },
  { type: "link", label: "Dashboard", href: "/admin/dashboard" },
  { type: "link", label: "Users", href: "/admin/users" },
  { type: "link", label: "Roles & Permissions", href: "/admin/roles" },
  { type: "link", label: "Shops", href: "/admin/shops" },
  { type: "link", label: "Audit Log", href: "/admin/audit" },
  { type: "section", label: "Account" },
  { type: "link", label: "Profile", href: "/admin/profile" },
]
