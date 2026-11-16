import { useState, useMemo } from "react"
import {
  Layers,
  Package,
  Activity,
  AlertCircle,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react"
import DataTable, { type TableColumn } from "react-data-table-component"
import { CatalogPageHeader } from "../../components/catalog/CatalogPageHeader"
import { CatalogFiltersBar } from "../../components/catalog/CatalogFiltersBar"
import { CatalogMetricsWrapper } from "../../components/catalog/CatalogMetricsWrapper"
import { MetricCard } from "../../components/products/MetricCard"
import { adminDataTableStyles } from "../../lib/dataTableStyles"
import { PortalActionMenu } from "../../components/common/PortalActionMenu"
import { StatusBadge } from "../../components/common/StatusBadge"
import { ConfirmationDialog } from "../../components/common/ConfirmationDialog"
import { EditBrandDrawer } from "../../components/shop-admin/EditBrandDrawer"
import type { Brand } from "../../types/catalog"
import { CreateBrandModal } from "@/admin/components/shop-admin/CreateBrandModal"

const MOCK_BRANDS: Brand[] = [
  {
    id: 1,
    name: "Power Zenox",
    slug: "power-zenox",
    logoUrl: null,
    productCount: 3,
    isActive: true,
  },
  {
    id: 2,
    name: "Herbal Life",
    slug: "herbal-life",
    logoUrl: null,
    productCount: 12,
    isActive: true,
  },
  {
    id: 3,
    name: "Nature's Own",
    slug: "natures-own",
    logoUrl: null,
    productCount: 0,
    isActive: false,
  },
]

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>(MOCK_BRANDS)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)

  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const matchSearch = b.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        status === "all" || (status === "active" ? b.isActive : !b.isActive)
      return matchSearch && matchStatus
    })
  }, [brands, search, status])

  const handleCreate = (brand: Brand) => {
    setBrands((prev) => [brand, ...prev])
    setSuccessMessage(`"${brand.name}" was added.`)
  }

  const handleUpdate = (updated: Brand) => {
    setBrands((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    setSuccessMessage(`"${updated.name}" was updated.`)
  }

  const handleDeleteConfirm = () => {
    if (!deletingBrand) return
    setBrands((prev) => prev.filter((b) => b.id !== deletingBrand.id))
    setSuccessMessage(`"${deletingBrand.name}" was deleted.`)
    setDeletingBrand(null)
  }

  const columns: TableColumn<Brand>[] = [
    {
      name: "BRAND",
      minWidth: "250px",
      cell: (row) => (
        <div className="flex items-center gap-3 py-2">
          <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-(--border-light) bg-(--bg-app)">
            {row.logoUrl ? (
              <img
                src={row.logoUrl}
                alt={row.name}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-(--text-muted)">
                {row.name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-(--text-primary)">
              {row.name}
            </p>
            <p className="truncate font-mono text-xs text-(--text-muted)">
              {row.slug}
            </p>
          </div>
        </div>
      ),
    },
    {
      name: "PRODUCTS",
      width: "120px",
      cell: (row) => (
        <span className="text-sm font-medium text-(--text-primary) tabular-nums">
          {row.productCount}
        </span>
      ),
    },
    {
      name: "STATUS",
      width: "120px",
      cell: (row) => (
        <StatusBadge
          variant={row.isActive ? "active" : "inactive"}
          label={row.isActive ? "Active" : "Inactive"}
        />
      ),
    },
    {
      name: "",
      width: "56px",
      right: true,
      cell: (row) => (
        <PortalActionMenu
          label={`Actions for ${row.name}`}
          trigger={<MoreVertical className="size-4" />}
          triggerClassName="rounded p-1 text-(--text-muted) transition-colors hover:bg-(--bg-surface-hover) hover:text-(--text-primary)"
          menuClassName="w-40"
        >
          {(closeMenu) => (
            <>
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  setEditingBrand(row)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
              >
                <Pencil className="size-3.5" /> Edit Brand
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  setDeletingBrand(row)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </>
          )}
        </PortalActionMenu>
      ),
    },
  ]

  return (
    <div className="min-w-0 space-y-3 p-4 md:p-5">
      <CatalogPageHeader
        title="Brands"
        subtitle="Manage product brands and their logos"
        badgeText={`${brands.length} Brands`}
        onExport={() => alert("Export")}
        onAdd={() => setCreateOpen(true)}
        addLabel="Add Brand"
      />

      <CatalogMetricsWrapper>
        <MetricCard
          label="Total Brands"
          value={String(brands.length)}
          detail="Across catalog"
          icon={Layers}
          tone="teal"
        />
        <MetricCard
          label="Active Brands"
          value={String(brands.filter((b) => b.isActive).length)}
          detail="Visible on site"
          icon={Activity}
          tone="teal"
        />
        <MetricCard
          label="Total Products"
          value={String(
            brands.reduce((acc, curr) => acc + curr.productCount, 0)
          )}
          detail="Linked to brands"
          icon={Package}
          tone="indigo"
        />
        <MetricCard
          label="Empty Brands"
          value={String(brands.filter((b) => b.productCount === 0).length)}
          detail="No products yet"
          icon={AlertCircle}
          tone="coral"
        />
      </CatalogMetricsWrapper>

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

      <section className="overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface)">
        <CatalogFiltersBar
          searchValue={search}
          onSearchChange={setSearch}
          selects={[
            {
              value: status,
              onChange: setStatus,
              placeholder: "All Statuses",
              options: [
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
              ],
            },
          ]}
        />
        <DataTable
          columns={columns}
          data={filteredBrands}
          customStyles={adminDataTableStyles}
          pagination
          noDataComponent={
            <p className="py-10 text-center text-sm text-(--text-muted)">
              No brands found.
            </p>
          }
        />
      </section>

      <EditBrandDrawer
        open={editingBrand !== null}
        brand={editingBrand}
        onClose={() => setEditingBrand(null)}
        onSuccess={handleUpdate}
      />

      <ConfirmationDialog
        open={deletingBrand !== null}
        variant="danger"
        icon={Trash2}
        title="Delete Brand?"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong>{deletingBrand?.name}</strong>? This action cannot be
            undone.
          </>
        }
        notice={
          deletingBrand && deletingBrand.productCount > 0 ? (
            <div className="flex items-start gap-2 rounded-md border border-(--status-pending-bg) bg-(--status-pending-bg)/50 p-2.5 text-[11px] text-(--status-pending-text)">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                This brand is linked to {deletingBrand.productCount} product
                {deletingBrand.productCount === 1 ? "" : "s"}. Products will be
                unlinked but not deleted.
              </span>
            </div>
          ) : null
        }
        confirmLabel="Delete Brand"
        onCancel={() => setDeletingBrand(null)}
        onConfirm={handleDeleteConfirm}
      />
      <CreateBrandModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreate}
      />
    </div>
  )
}
