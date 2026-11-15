import {
  LayoutGridCircles,
  ScrollText,
  Store,
  User,
  UserRoundGroup,
  UserShield,
} from "lucide-react"
import type { MenuItem } from "./menu"

export const superAdminMenu: MenuItem[] = [
  { type: "section", label: "Platform" },
  {
    type: "link",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutGridCircles,
  },
  { type: "link", label: "Users", href: "/admin/users", icon: UserRoundGroup },
  {
    type: "link",
    label: "Roles & Permissions",
    href: "/admin/roles",
    icon: UserShield,
  },
  { type: "link", label: "Shops", href: "/admin/shops", icon: Store },
  { type: "link", label: "Audit Log", href: "/admin/audit", icon: ScrollText },
  { type: "section", label: "Account" },
  { type: "link", label: "Profile", href: "/admin/profile", icon: User },
]
