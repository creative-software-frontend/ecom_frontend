import {
  Archive,
  LayoutGridCircles,
  LifeBuoy,
  Newspaper,
  Package,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"

export type MenuItem =
  // | { type: "section"; label: string }
  | {
      type: "link"
      label: string
      href: string
      badge?: string | number
      disabled?: boolean
      icon: LucideIcon
    }
  | {
      type: "group"
      label: string
      items: MenuItem[]
      disabled?: boolean
    }

/** Shop-admin sidebar menu. Super admin uses `superAdminMenu` instead. */
export const shopMenu: MenuItem[] = [
  // { type: "section", label: "Fulfillment" },
  {
    type: "link",
    label: "Dashboard",
    href: "/shop/dashboard",
    icon: LayoutGridCircles,
  },
  {
    type: "link",
    label: "Orders",
    href: "/shop/orders",
    badge: 0,
    icon: Package,
  },
  {
    type: "link",
    label: "Products",
    href: "/shop/products",
    badge: 0,
    icon: Archive,
  },
  {
    type: "link",
    label: "Users",
    href: "/shop/users",
    badge: 0,
    icon: Users,
  },
  {
    type: "link",
    label: "News",
    href: "/shop/news",
    icon: Newspaper,
  },
  {
    type: "link",
    label: "Support",
    href: "/shop/support",
    icon: LifeBuoy,
  },
  // { type: "section", label: "Configuration" },
  { type: "link", label: "Settings", href: "/shop/settings", icon: Settings },
]
