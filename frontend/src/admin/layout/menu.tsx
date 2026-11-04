export type MenuItem = {
  label: string
  type: "section" | "link" | "disabled"
  href?: string
  badge?: number | string
  items?: MenuItem[]
}

export const adminMenu: MenuItem[] = [
  {
    label: "FULFILLMENT",
    type: "section",
  },
  {
    label: "Dashboard",
    type: "link",
    href: "/admin",
  },
  {
    label: "Orders",
    type: "link",
    href: "/admin/orders",
    badge: 12,
  },
  {
    label: "Products",
    type: "link",
    href: "/admin/products",
  },
  {
    label: "Reviews",
    type: "link",
    href: "/admin/reviews",
  },
  {
    label: "CONFIGURATION",
    type: "section",
  },
  {
    label: "Settings",
    type: "link",
    href: "/admin/settings",
  },
]
