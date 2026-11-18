import { useMemo, useState } from "react"
import { Plus, Download, Ban, Trash2, Unlock } from "lucide-react"
import { useNavigate } from "react-router"
import { SuperAdminProductsMetrics } from "../../components/super-admin/SuperAdminProductsMetrics"
import { SuperAdminProductsToolbar } from "../../components/super-admin/SuperAdminProductsToolbar"
import { SuperAdminProductsTable } from "../../components/super-admin/SuperAdminProductsTable"
import { ConfirmationDialog } from "../../components/common/ConfirmationDialog"
import {
  MOCK_SHOPS,
  MOCK_SUPER_ADMIN_PRODUCTS,
} from "../../data/superAdminProductsMock"
import {
  getSuperAdminProductStatus,
  type SuperAdminProduct,
} from "../../types/superAdminProduct"

export default function SuperAdminProductsPage() {
  const navigate = useNavigate()

  // Mutable state — mock mutations only. Backend will replace this later.
  const [products, setProducts] = useState<SuperAdminProduct[]>(
    MOCK_SUPER_ADMIN_PRODUCTS
  )
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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

  // Handlers
  function handleEdit(product: SuperAdminProduct) {
    navigate(`/admin/products/${product.id}/edit`)
  }

  function handleBlockConfirm() {
    if (!productToBlock) return
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productToBlock.id ? { ...p, isBlocked: true } : p
      )
    )
    setSuccessMessage(`"${productToBlock.name}" was blocked.`)
    setProductToBlock(null)
  }

  function handleUnblockConfirm() {
    if (!productToUnblock) return
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productToUnblock.id ? { ...p, isBlocked: false } : p
      )
    )
    setSuccessMessage(`"${productToUnblock.name}" was unblocked.`)
    setProductToUnblock(null)
  }

  function handleDeleteConfirm() {
    if (!productToDelete) return
    setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
    setSuccessMessage(`"${productToDelete.name}" was deleted.`)
    setProductToDelete(null)
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
            onClick={() => alert("Export — backend later")}
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

      {/* Success banner */}
      {successMessage && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-md border border-(--status-delivered-bg) bg-(--status-delivered-bg)/50 px-4 py-2.5 text-sm text-(--status-delivered-text)"
        >
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-medium hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Table card */}
      <section className="overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface)">
        <SuperAdminProductsToolbar
          search={search}
          onSearchChange={setSearch}
          shopId={shopId}
          onShopChange={setShopId}
          shops={MOCK_SHOPS}
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
        onCancel={() => setProductToBlock(null)}
        onConfirm={handleBlockConfirm}
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
        onCancel={() => setProductToUnblock(null)}
        onConfirm={handleUnblockConfirm}
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
        onCancel={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
