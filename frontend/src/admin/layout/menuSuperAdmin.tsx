import {
  Archive,
  LayoutGridCircles,
  Megaphone,
  ScrollText,
  ShoppingCart,
  Store,
  User,
  UserRoundGroup,
  UserShield,
} from "lucide-react"
import type { MenuItem } from "./menu"

export const superAdminMenu: MenuItem[] = [
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
  { type: "link", label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { type: "link", label: "Products", href: "/admin/products", icon: Archive },
  { type: "link", label: "News", href: "/admin/news", icon: Megaphone },
  { type: "link", label: "Audit Log", href: "/admin/audit", icon: ScrollText },
  { type: "link", label: "Profile", href: "/admin/profile", icon: User },
]
