export type MenuItem = {
  label: string
  type: "group" | "link" | "disabled"
  href?: string
  items?: MenuItem[]
  disabled?: boolean
}

export const adminMenu: MenuItem[] = [
  {
    label: "Dashboards",
    type: "link",
    href: "/admin",
  },
  {
    label: "Profile",
    type: "link",
    href: "/admin/profile",
  },
  {
    label: "Products",
    type: "group",
    items: [
      {
        label: "View Products",
        type: "link",
        href: "/admin/products",
      },
      {
        label: "Add Product",
        type: "link",
        href: "/admin/products/new",
      },
    ],
  },
  {
    label: "Settings",
    type: "link",
    href: "/admin/settings",
  },
  { label: "UI Components", type: "disabled", disabled: true },
  { label: "Tables", type: "disabled", disabled: true },
  { label: "Widgets", type: "disabled", disabled: true },
  { label: "Forms", type: "disabled", disabled: true },
  { label: "Charts", type: "disabled", disabled: true },
]
