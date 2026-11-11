export type MenuItem =
  | { type: "section"; label: string }
  | {
      type: "link"
      label: string
      href: string
      badge?: string | number
      disabled?: boolean
    }
  | {
      type: "group"
      label: string
      items: MenuItem[]
      disabled?: boolean
    }

/** Shop-admin sidebar menu. Super admin uses `superAdminMenu` instead. */
export const shopMenu: MenuItem[] = [
  { type: "section", label: "Fulfillment" },
  { type: "link", label: "Dashboard", href: "/shop/dashboard" },
  { type: "link", label: "Orders", href: "/shop/orders", badge: 0 },
  { type: "link", label: "Products", href: "/shop/products", badge: 0 },
  { type: "section", label: "Configuration" },
  { type: "link", label: "Settings", href: "/shop/settings" },
]
