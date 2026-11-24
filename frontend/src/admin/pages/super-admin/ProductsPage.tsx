import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Download, Ban, Trash2, Unlock } from "lucide-react"
import { useNavigate } from "react-router"
import { SuperAdminProductsMetrics } from "../../components/super-admin/SuperAdminProductsMetrics"
import { SuperAdminProductsToolbar } from "../../components/super-admin/SuperAdminProductsToolbar"
import { SuperAdminProductsTable } from "../../components/super-admin/SuperAdminProductsTable"
import { ConfirmationDialog } from "../../components/common/ConfirmationDialog"
import { ErrorState } from "../../components/common/ErrorState"
import { InlineNotice } from "../../components/common/InlineNotice"
import { superAdminApi } from "../../api/superAdminApi"
import {
  describeSuperAdminProductError,
  superAdminProductQueryKeys,
  superAdminProductsApi,
} from "../../api/superAdminProductsApi"
import {
  getSuperAdminProductStatus,
  type SuperAdminProduct,
} from "../../types/superAdminProduct"

type ProductAction = "block" | "unblock" | "delete"
type ActionInput = { action: ProductAction; product: SuperAdminProduct }
type Notice = { tone: "success" | "error"; message: string }

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function downloadProductsCsv(products: SuperAdminProduct[]) {
  const headers = [
    "Name",
    "Slug",
    "Brand",
    "Category",
    "Shop",
    "Selling Price (BDT)",
    "Regular Price (BDT)",
    "Buying Price (BDT)",
    "Stock",
    "Status",
    "Sales",
  ]
  const rows = products.map((product) => [
    product.name,
    product.slug,
    product.brandName,
    product.category,
    product.shopName,
    product.currentPrice,
    product.regularPrice,
    product.buyingPrice ?? "",
    product.stockQuantity,
    getSuperAdminProductStatus(product),
    product.salesCount ?? 0,
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")
  const blob = new Blob(["\uFEFF", csv], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `super-admin-products-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export default function SuperAdminProductsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const productsQuery = useQuery({
    queryKey: superAdminProductQueryKeys.list(),
    queryFn: ({ signal }) => superAdminProductsApi.list({}, signal),
    staleTime: 30 * 1000,
  })
  const shopsQuery = useQuery({
    queryKey: ["admin", "super", "shops", "product-filter-options"],
    queryFn: ({ signal }) => superAdminApi.shops.list(signal),
    staleTime: 60 * 1000,
  })

  const [search, setSearch] = useState("")
  const [shopId, setShopId] = useState<number | "all">("all")
  const [status, setStatus] = useState<
    "all" | "active" | "inactive" | "blocked"
  >("all")
  const [category, setCategory] = useState("all")

  // Dialog state
  const [productToBlock, setProductToBlock] =
    useState<SuperAdminProduct | null>(null)
  const [productToUnblock, setProductToUnblock] =
    useState<SuperAdminProduct | null>(null)
  const [productToDelete, setProductToDelete] =
    useState<SuperAdminProduct | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const actionMutation = useMutation({
    mutationFn: async ({ action, product }: ActionInput): Promise<void> => {
      switch (action) {
        case "block":
          await superAdminProductsApi.block(product.id)
          return
        case "unblock":
          await superAdminProductsApi.unblock(product.id)
          return
        case "delete":
          await superAdminProductsApi.remove(product.id)
          return
      }
    },
    onSuccess: (_result, { action, product }) => {
      void queryClient.invalidateQueries({
        queryKey: superAdminProductQueryKeys.all,
      })
      void queryClient.invalidateQueries({ queryKey: ["admin", "sidebar-stats"] })
      setProductToBlock(null)
      setProductToUnblock(null)
      setProductToDelete(null)
      const verb =
        action === "block"
          ? "blocked"
          : action === "unblock"
            ? "unblocked"
            : "deleted"
      setNotice({
        tone: "success",
        message: `"${product.name}" was ${verb}.`,
      })
    },
    onError: (error, { action, product }) => {
      // Close the dialog first so the backend message stays visible in the notice.
      setProductToBlock(null)
      setProductToUnblock(null)
      setProductToDelete(null)
      const verb =
        action === "block"
          ? "block"
          : action === "unblock"
            ? "unblock"
            : "delete"
      setNotice({
        tone: "error",
        message: `Failed to ${verb} "${product.name}": ${describeSuperAdminProductError(error, "Please try again.")}`,
      })
    },
  })

  const products = useMemo(() => productsQuery.data ?? [], [productsQuery.data])
  const shops = useMemo(
    () =>
      (shopsQuery.data ?? []).map((shop) => ({
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
      })),
    [shopsQuery.data]
  )

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.brandName.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      const matchShop = shopId === "all" || p.shopId === shopId
      const matchStatus =
        status === "all" || getSuperAdminProductStatus(p) === status
      const matchCategory = category === "all" || p.category === category
      return matchSearch && matchShop && matchStatus && matchCategory
    })

    return [...list].sort((a, b) => {
      const diff = (b.salesCount ?? 0) - (a.salesCount ?? 0)
      return diff !== 0 ? diff : b.id - a.id
    })
  }, [products, search, shopId, status, category])

  const queryError = productsQuery.error ?? shopsQuery.error
  if (queryError) {
    return (
      <div className="p-4 md:p-5">
        <ErrorState
          message={describeSuperAdminProductError(
            queryError,
            "Failed to load products"
          )}
          onRetry={() => {
            void productsQuery.refetch()
            void shopsQuery.refetch()
          }}
          className="flex flex-col items-center gap-3 rounded-md border border-(--border-light) bg-(--bg-surface) py-16 text-center"
          messageClassName="text-sm font-medium text-(--text-muted)"
          buttonClassName="inline-flex h-9 items-center rounded-md bg-(--primary) px-4 text-sm font-medium text-white hover:bg-(--primary-hover)"
        />
      </div>
    )
  }

  function handleEdit(product: SuperAdminProduct) {
    navigate(`/admin/products/${product.id}/edit`)
  }

  return (
    <div className="min-w-0 space-y-3 p-4 md:p-5">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-(--text-primary)">
              Products
            </h1>
            <span className="rounded-full bg-(--primary-soft) px-2 py-0.5 text-xs font-semibold text-(--primary)">
              {products.filter((p) => !p.isBlocked && p.isActive).length} Active
            </span>
          </div>
          <p className="mt-0.5 text-xs text-(--text-muted)">
            Manage every product across all shops — block, edit, or remove
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadProductsCsv(filtered)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-(--border-light) bg-(--bg-surface) px-3 text-xs font-medium text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
          >
            <Download className="size-4" />
            Export
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/products/new")}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-(--primary) px-3 text-xs font-medium text-white transition-colors hover:bg-(--primary-hover)"
          >
            <Plus className="size-4" />
            Add Product
          </button>
        </div>
      </header>

      {/* Metrics */}
      <SuperAdminProductsMetrics products={products} />

      {/* Feedback */}
      {notice && (
        <InlineNotice
          message={notice.message}
          variant={notice.tone}
          ariaLive={notice.tone === "error" ? "assertive" : "polite"}
          dismissLabel="Dismiss notification"
          onDismiss={() => setNotice(null)}
          className={
            notice.tone === "error"
              ? "flex items-center justify-between gap-3 rounded-md border border-(--status-cancelled-bg) bg-(--status-cancelled-bg)/50 px-4 py-2.5 text-sm text-(--status-cancelled-text)"
              : "flex items-center justify-between gap-3 rounded-md border border-(--status-delivered-bg) bg-(--status-delivered-bg)/50 px-4 py-2.5 text-sm text-(--status-delivered-text)"
          }
          dismissClassName="text-xs font-medium hover:underline"
        />
      )}

      {/* Table card */}
      <section className="overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface)">
        <SuperAdminProductsToolbar
          search={search}
          onSearchChange={setSearch}
          shopId={shopId}
          onShopChange={setShopId}
          shops={shops}
          status={status}
          onStatusChange={setStatus}
          category={category}
          onCategoryChange={setCategory}
          categories={categories}
          visibleCount={filtered.length}
          totalCount={products.length}
        />
        <SuperAdminProductsTable
          products={filtered}
          isLoading={productsQuery.isPending}
          onEdit={handleEdit}
          onBlock={setProductToBlock}
          onUnblock={setProductToUnblock}
          onDelete={setProductToDelete}
        />
      </section>

      {/* Block confirmation */}
      <ConfirmationDialog
        open={productToBlock !== null}
        variant="danger"
        icon={Ban}
        title="Block this product?"
        description={
          <>
            <strong>{productToBlock?.name}</strong> will be hidden from the
            storefront and frozen. You won&apos;t be able to edit or delete it
            until it&apos;s unblocked.
          </>
        }
        notice={
          <div className="flex items-start gap-2 rounded-md border border-(--status-pending-bg) bg-(--status-pending-bg)/50 p-2.5 text-[11px] text-(--status-pending-text)">
            <Ban className="mt-0.5 size-3.5 shrink-0" />
            <span>
              The product remains in this list so you can unblock it later. The
              shop admin cannot unblock — only a super admin can.
            </span>
          </div>
        }
        confirmLabel="Block Product"
        isPending={actionMutation.isPending}
        onCancel={() => setProductToBlock(null)}
        onConfirm={() =>
          productToBlock &&
          actionMutation.mutate({ action: "block", product: productToBlock })
        }
      />

      {/* Unblock confirmation */}
      <ConfirmationDialog
        open={productToUnblock !== null}
        variant="success"
        icon={Unlock}
        title="Unblock this product?"
        description={
          <>
            <strong>{productToUnblock?.name}</strong> will return to its
            previous active/inactive state. You&apos;ll be able to edit or
            delete it again.
          </>
        }
        confirmLabel="Unblock Product"
        isPending={actionMutation.isPending}
        onCancel={() => setProductToUnblock(null)}
        onConfirm={() =>
          productToUnblock &&
          actionMutation.mutate({
            action: "unblock",
            product: productToUnblock,
          })
        }
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={productToDelete !== null}
        variant="danger"
        icon={Trash2}
        title="Delete product?"
        description={
          <>
            Permanently delete <strong>{productToDelete?.name}</strong> from{" "}
            <strong>{productToDelete?.shopName}</strong>? This cannot be undone.
          </>
        }
        confirmLabel="Delete Product"
        isPending={actionMutation.isPending}
        onCancel={() => setProductToDelete(null)}
        onConfirm={() =>
          productToDelete &&
          actionMutation.mutate({ action: "delete", product: productToDelete })
        }
      />
    </div>
  )
}
