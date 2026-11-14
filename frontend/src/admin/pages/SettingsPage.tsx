import { Navigate, useParams } from "react-router"
import type { SettingsTabId } from "../components/settings/SettingsLayout"
import StoreTab from "../components/settings/tabs/StoreTab"
import StorefrontTab from "../components/settings/tabs/StorefrontTab"
import OrdersTab from "../components/settings/tabs/OrdersTab"
import CouponsTab from "../components/settings/tabs/CouponsTab"
import MarketingTab from "../components/settings/tabs/MarketingTab"
import PagesTab from "../components/settings/tabs/PagesTab"
import CourierTab from "../components/settings/tabs/CourierTab"

const VALID_TABS: SettingsTabId[] = [
  "store",
  "storefront",
  "orders",
  "coupons",
  "pages",
  "marketing",
  "courier",
]

function isTabId(value: string | undefined): value is SettingsTabId {
  return !!value && VALID_TABS.includes(value as SettingsTabId)
}

export default function SettingsPage() {
  const { tab } = useParams<{ tab: string }>()

  if (!isTabId(tab)) {
    return <Navigate to="/shop/settings/store" replace />
  }

  // Add new tabs here as they're built
  console.log(tab)
  switch (tab) {
    case "store":
      return <StoreTab />
    case "storefront":
      return <StorefrontTab />
    case "orders":
      return <OrdersTab />
    case "coupons":
      return <CouponsTab />
    case "pages":
      return <PagesTab />
    case "marketing":
      return <MarketingTab />
    case "courier":
      return <CourierTab />

    // return (
    //   <div className="flex items-center justify-center p-12 text-sm text-(--text-muted)">
    //     This settings tab is coming soon.
    //   </div>
    // )
    default:
      return <Navigate to="/shop/settings/store" replace />
  }
}
