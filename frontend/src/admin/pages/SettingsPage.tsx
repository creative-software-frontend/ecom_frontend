import { useParams } from "react-router"
import type { SettingsTabId } from "../components/settings/SettingsLayout"
import StoreTab from "../components/settings/tabs/StoreTab"
import StorefrontTab from "../components/settings/tabs/StorefrontTab"
import OrdersTab from "../components/settings/tabs/OrdersTab"
import CouponsTab from "../components/settings/tabs/CouponsTab"
import MarketingTab from "../components/settings/tabs/MarketingTab"
import PagesTab from "../components/settings/tabs/PagesTab"
import CourierTab from "../components/settings/tabs/CourierTab"
import SmsTab from "../components/settings/tabs/SmsTab"
import { useAuth } from "../auth/AuthProvider"
import { ShopAccessDenied } from "../auth/RequireShopPermission"
import { canReadSettingsTab } from "../lib/permissions"

const VALID_TABS: SettingsTabId[] = [
  "store",
  "storefront",
  "orders",
  "coupons",
  "pages",
  "marketing",
  "courier",
  "sms",
]

function isTabId(value: string | undefined): value is SettingsTabId {
  return !!value && VALID_TABS.includes(value as SettingsTabId)
}

export default function SettingsPage() {
  const { tab } = useParams<{ tab: string }>()
  const { state } = useAuth()
  const user = state.status === "authenticated" ? state.user : null

  // Render the denied panel before any tab component can fire queries.
  if (!isTabId(tab) || !canReadSettingsTab(user, tab)) {
    return <ShopAccessDenied />
  }

  // Add new tabs here as they're built
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
    case "sms":
      return <SmsTab />

    default:
      return <ShopAccessDenied />
  }
}
