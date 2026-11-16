import { useState, useMemo } from "react"
import {
  FolderTree,
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
import { EditCategoryDrawer } from "../../components/shop-admin/EditCategoryDrawer"
import type { Category } from "../../types/catalog"
import { CreateCategoryModal } from "@/admin/components/shop-admin/CreateCategoryModal"

const MOCK_CATEGORIES: Category[] = [
  {
    id: 1,
    name: "Herbal Supplement",
    slug: "herbal-supplement",
    productCount: 15,
    isActive: true,
  },
  {
    id: 2,
    name: "Vitality",
    slug: "vitality",
    productCount: 8,
    isActive: true,
  },
  {
    id: 3,
    name: "Weight Management",
    slug: "weight-management",
    productCount: 0,
    isActive: false,
  },
]

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(MOCK_CATEGORIES)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)

  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  )
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus =
        status === "all" || (status === "active" ? c.isActive : !c.isActive)
      return matchSearch && matchStatus
    })
  }, [categories, search, status])

  const handleCreate = (category: Category) => {
    setCategories((prev) => [category, ...prev])
    setSuccessMessage(`"${category.name}" was added.`)
  }

  const handleUpdate = (updated: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    )
    setSuccessMessage(`"${updated.name}" was updated.`)
  }

  const handleDeleteConfirm = () => {
    if (!deletingCategory) return
    setCategories((prev) => prev.filter((c) => c.id !== deletingCategory.id))
    setSuccessMessage(`"${deletingCategory.name}" was deleted.`)
    setDeletingCategory(null)
  }

  const columns: TableColumn<Category>[] = [
    {
      name: "CATEGORY NAME",
      minWidth: "250px",
      cell: (row) => (
        <div className="py-2">
          <p className="text-sm font-semibold text-(--text-primary)">
            {row.name}
          </p>
          <p className="font-mono text-xs text-(--text-muted)">{row.slug}</p>
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
          menuClassName="w-44"
        >
          {(closeMenu) => (
            <>
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  setEditingCategory(row)
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs text-(--text-primary) transition-colors hover:bg-(--bg-surface-hover)"
              >
                <Pencil className="size-3.5" /> Edit Category
              </button>
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  setDeletingCategory(row)
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
        title="Categories"
        subtitle="Organize your catalog into categories"
        badgeText={`${categories.length} Categories`}
        onExport={() => alert("Export")}
        onAdd={() => setCreateOpen(true)}
        addLabel="Add Category"
      />

      <CatalogMetricsWrapper>
        <MetricCard
          label="Total Categories"
          value={String(categories.length)}
          detail="Catalog structure"
          icon={FolderTree}
          tone="teal"
        />
        <MetricCard
          label="Active Categories"
          value={String(categories.filter((c) => c.isActive).length)}
          detail="Visible on site"
          icon={Activity}
          tone="teal"
        />
        <MetricCard
          label="Categorized Products"
          value={String(
            categories.reduce((acc, curr) => acc + curr.productCount, 0)
          )}
          detail="Total assignments"
          icon={Package}
          tone="indigo"
        />
        <MetricCard
          label="Empty Categories"
          value={String(categories.filter((c) => c.productCount === 0).length)}
          detail="Needs attention"
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
          data={filteredCategories}
          customStyles={adminDataTableStyles}
          pagination
          noDataComponent={
            <p className="py-10 text-center text-sm text-(--text-muted)">
              No categories found.
            </p>
          }
        />
      </section>

      <EditCategoryDrawer
        open={editingCategory !== null}
        category={editingCategory}
        onClose={() => setEditingCategory(null)}
        onSuccess={handleUpdate}
      />

      <ConfirmationDialog
        open={deletingCategory !== null}
        variant="danger"
        icon={Trash2}
        title="Delete Category?"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong>{deletingCategory?.name}</strong>? This action cannot be
            undone.
          </>
        }
        notice={
          deletingCategory && deletingCategory.productCount > 0 ? (
            <div className="flex items-start gap-2 rounded-md border border-(--status-pending-bg) bg-(--status-pending-bg)/50 p-2.5 text-[11px] text-(--status-pending-text)">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              <span>
                This category has {deletingCategory.productCount} product
                {deletingCategory.productCount === 1 ? "" : "s"} assigned.
                Products will be uncategorized but not deleted.
              </span>
            </div>
          ) : null
        }
        confirmLabel="Delete Category"
        onCancel={() => setDeletingCategory(null)}
        onConfirm={handleDeleteConfirm}
      />
      <CreateCategoryModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreate}
      />
    </div>
  )
}
