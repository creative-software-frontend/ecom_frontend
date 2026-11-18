import { useState } from "react"
import {
  Plus,
  Download,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  List,
} from "lucide-react"
import { useNavigate } from "react-router"
import { useAdminShopsPaginated } from "../../hooks/useAdminUsers"
import { ShopsMetricsCards } from "../../components/super-admin/ShopsMetricsCards"
import { StoreDensityCard } from "@/admin/components/super-admin/StoreDensityCard"
import { DivisionSalesCard } from "@/admin/components/super-admin/DivisionSalesCard"
import { TopSellingItemsCard } from "@/admin/components/super-admin/TopSellingItemsCard"
import { TopVerticalsCard } from "@/admin/components/super-admin/TopVerticalsCard"
import { TopShopsCard } from "@/admin/components/super-admin/TopShopsCard"
import { MOCK_SHOP_SUMMARY } from "@/admin/data/shopSummaryMock"
import { CreateShopModal } from "@/admin/components/super-admin/CreateShopModal"

export default function ShopsPage() {
  const navigate = useNavigate()

  // Summary metrics need the full platform counts — no list filters here.
  const { data } = useAdminShopsPaginated({})

  // Modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [insightsExpanded, setInsightsExpanded] = useState(true)

  return (
    <div className="min-w-0 space-y-4 bg-(--bg-app) p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-(--text-primary)">Shops</h1>
          <p className="mt-0.5 text-sm text-(--text-muted)">
            Manage multi-tenant shops, subscriptions, and active statuses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover)">
            <Download className="size-4" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/shops/all")}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-sm font-medium text-(--text-primary) hover:bg-(--bg-surface-hover)"
          >
            <List className="size-4" /> All Shops
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-(--primary) px-3 text-sm font-medium text-white hover:bg-(--primary-hover)"
          >
            <Plus className="size-4" /> Add Shop
          </button>
        </div>
      </div>

      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-(--status-delivered-bg) bg-(--status-delivered-bg)/50 px-4 py-2.5 text-sm text-(--status-delivered-text)"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            {successMessage}
          </span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="rounded p-1 hover:bg-(--status-delivered-bg)"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* Metrics */}
      {data && <ShopsMetricsCards counts={data.counts} />}

      {/* Shop Summary */}
      <section className="mt-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-(--text-primary)">
              Shop Summary
            </h2>
            <p className="mt-0.5 text-xs text-(--text-muted)">
              Shops, today&apos;s sales and best-selling products across
              divisions
            </p>
          </div>
          <button
            type="button"
            aria-expanded={insightsExpanded}
            aria-controls="shop-summary-content"
            onClick={() => setInsightsExpanded((expanded) => !expanded)}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-xs font-medium text-(--text-primary) hover:bg-(--bg-surface-hover)"
          >
            {insightsExpanded ? (
              <>
                Collapse <ChevronUp className="size-3.5" />
              </>
            ) : (
              <>
                Expand <ChevronDown className="size-3.5" />
              </>
            )}
          </button>
        </div>
        {insightsExpanded ? (
          <div id="shop-summary-content" className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <StoreDensityCard divisions={MOCK_SHOP_SUMMARY.divisions} />
              <DivisionSalesCard divisions={MOCK_SHOP_SUMMARY.divisions} />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TopSellingItemsCard items={MOCK_SHOP_SUMMARY.topItems} />
              <TopVerticalsCard
                categories={MOCK_SHOP_SUMMARY.categories}
                totalSkus={MOCK_SHOP_SUMMARY.totalSkus}
              />
            </div>
            <TopShopsCard shops={MOCK_SHOP_SUMMARY.topShops} />
          </div>
        ) : null}
      </section>
      {/* Modals */}
      <CreateShopModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(msg) => setSuccessMessage(msg)}
      />
    </div>
  )
}
