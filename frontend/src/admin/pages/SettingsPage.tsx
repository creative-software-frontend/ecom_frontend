import { Navigate, useParams } from "react-router"
import type { SettingsTabId } from "../components/settings/SettingsLayout"
import StoreTab from "../components/settings/tabs/StoreTab"

const VALID_TABS: SettingsTabId[] = [
  "store",
  "storefront",
  "orders",
  "coupons",
  "pages",
  "marketing",
]

function isTabId(value: string | undefined): value is SettingsTabId {
  return !!value && VALID_TABS.includes(value as SettingsTabId)
}

export default function SettingsPage() {
  const { tab } = useParams<{ tab: string }>()

  if (!isTabId(tab)) {
    return <Navigate to="/admin/settings/store" replace />
  }

  // Add new tabs here as they're built
  switch (tab) {
    case "store":
      return <StoreTab />
    case "storefront":
    case "orders":
    case "coupons":
    case "pages":
    case "marketing":
      return (
        <div className="flex items-center justify-center p-12 text-sm text-(--text-muted)">
          This settings tab is coming soon.
        </div>
      )
    default:
      return <Navigate to="/admin/settings/store" replace />
  }
}
