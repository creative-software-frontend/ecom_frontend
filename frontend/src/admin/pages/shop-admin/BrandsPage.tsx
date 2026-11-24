import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { ErrorState } from "../../components/common/ErrorState"
import { InlineNotice } from "../../components/common/InlineNotice"
import { LoadingState } from "../../components/common/LoadingState"
import { useDebouncedValue } from "../../hooks/useDebouncedValue"
import { ApiError } from "../../api/client"
import { brandsApi, brandQueryKeys } from "../../api/catalogApi"
import { getErrorMessage } from "../../lib/errors"
import type {
  Brand,
  BrandWriteInput,
  CatalogCounts,
  CatalogStatusFilter,
} from "../../types/catalog"
import { CreateBrandModal } from "@/admin/components/shop-admin/CreateBrandModal"

type Notice = { tone: "success" | "error"; message: string } | null

const EMPTY_COUNTS: CatalogCounts = {
  total: 0,
  active: 0,
  inactive: 0,
  linkedProducts: 0,
  empty: 0,
}

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function downloadBrandsCsv(items: Brand[]) {
  const headers = ["Name", "Slug", "Products", "Status", "Description", "Logo URL"]
  const rows = items.map((brand) => [
    brand.name,
    brand.slug,
    brand.productCount,
    brand.isActive ? "Active" : "Inactive",
    brand.description ?? "",
    brand.logoUrl ?? "",
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `brands-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function fieldErrors(error: unknown): Record<string, string> | null {
  return error instanceof ApiError && error.fieldErrors
    ? error.fieldErrors
    : null
}

export default function BrandsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [status, setStatus] = useState<CatalogStatusFilter>("all")
  const [notice, setNotice] = useState<Notice>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createFieldErrors, setCreateFieldErrors] = useState<
    Record<string, string> | null
  >(null)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [editFieldErrors, setEditFieldErrors] = useState<
    Record<string, string> | null
  >(null)
  const [deletingBrand, setDeletingBrand] = useState<Brand | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const params = useMemo(
    () => ({ q: debouncedSearch, status }),
    [debouncedSearch, status]
  )
  const brandsQuery = useQuery({
    queryKey: brandQueryKeys.list(params),
    queryFn: ({ signal }) => brandsApi.list(params, signal),
  })

  const invalidateBrands = () =>
    queryClient.invalidateQueries({ queryKey: brandQueryKeys.all })

  const createMutation = useMutation({
    mutationFn: (input: BrandWriteInput) => brandsApi.create(input),
    onSuccess: (brand) => {
      void invalidateBrands()
      setCreateOpen(false)
      setCreateError(null)
      setCreateFieldErrors(null)
      setNotice({ tone: "success", message: `"${brand.name}" was added.` })
    },
    onError: (error) => {
      setCreateError(getErrorMessage(error, "Could not create the brand."))
      setCreateFieldErrors(fieldErrors(error))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      brand,
      input,
    }: {
      brand: Brand
      input: BrandWriteInput
    }) => brandsApi.update(brand.id, input),
    onSuccess: (brand) => {
      void invalidateBrands()
      setEditingBrand(null)
      setEditError(null)
      setEditFieldErrors(null)
      setNotice({ tone: "success", message: `"${brand.name}" was updated.` })
    },
    onError: (error) => {
      setEditError(getErrorMessage(error, "Could not update the brand."))
      setEditFieldErrors(fieldErrors(error))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (brand: Brand) => brandsApi.remove(brand.id),
    onSuccess: (_, brand) => {
      void invalidateBrands()
      setDeletingBrand(null)
      setDeleteError(null)
      setNotice({ tone: "success", message: `"${brand.name}" was deleted.` })
    },
    onError: (error) => {
      setDeleteError(getErrorMessage(error, "Could not delete the brand."))
    },
  })

  const brands = brandsQuery.data?.items ?? []
  const counts = brandsQuery.data?.counts ?? EMPTY_COUNTS

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
                  setEditError(null)
                  setEditFieldErrors(null)
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
                  setDeleteError(null)
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

  if (brandsQuery.isLoading) {
    return (
      <LoadingState
        className="flex min-h-64 items-center justify-center text-sm text-(--text-muted)"
        ariaLabel="Loading brands"
      >
        Loading brands...
      </LoadingState>
    )
  }

  if (brandsQuery.error) {
    const permissionError =
      brandsQuery.error instanceof ApiError &&
      brandsQuery.error.status === 403
    return (
      <ErrorState
        className="m-6 rounded-md border border-(--border-light) bg-(--bg-surface) p-6 text-center"
        messageClassName="mb-3 text-sm text-(--text-muted)"
        buttonClassName="h-8 rounded-md bg-(--primary) px-3 text-sm font-medium text-white"
        message={
          permissionError
            ? "Only shop administrators can manage brands."
            : getErrorMessage(brandsQuery.error, "Could not load brands.")
        }
        onRetry={() => void brandsQuery.refetch()}
      />
    )
  }

  return (
    <div className="min-w-0 space-y-3 p-4 md:p-5">
      <CatalogPageHeader
        title="Brands"
        subtitle="Manage product brands and their logos"
        badgeText={`${counts.total} Brands`}
        onExport={() => downloadBrandsCsv(brands)}
        exportDisabled={brands.length === 0}
        onAdd={() => {
          setCreateError(null)
          setCreateFieldErrors(null)
          setCreateOpen(true)
        }}
        addLabel="Add Brand"
      />

      <CatalogMetricsWrapper>
        <MetricCard
          label="Total Brands"
          value={String(counts.total)}
          detail="Across catalog"
          icon={Layers}
          tone="teal"
        />
        <MetricCard
          label="Active Brands"
          value={String(counts.active)}
          detail="Visible on site"
          icon={Activity}
          tone="teal"
        />
        <MetricCard
          label="Total Products"
          value={String(counts.linkedProducts)}
          detail="Linked to brands"
          icon={Package}
          tone="indigo"
        />
        <MetricCard
          label="Empty Brands"
          value={String(counts.empty)}
          detail="No products yet"
          icon={AlertCircle}
          tone="coral"
        />
      </CatalogMetricsWrapper>

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
        />
      )}

      <section className="overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface)">
        <CatalogFiltersBar
          searchValue={search}
          onSearchChange={setSearch}
          selects={[
            {
              value: status,
              onChange: (value) => setStatus(value as CatalogStatusFilter),
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
          data={brands}
          customStyles={adminDataTableStyles}
          progressPending={brandsQuery.isFetching}
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
        isPending={updateMutation.isPending}
        error={editError}
        fieldErrors={editFieldErrors}
        onClearError={() => setEditError(null)}
        onClose={() => setEditingBrand(null)}
        onSubmit={(input) => {
          if (editingBrand) {
            updateMutation.mutate({ brand: editingBrand, input })
          }
        }}
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
        isPending={deleteMutation.isPending}
        errorMessage={deleteError}
        onCancel={() => setDeletingBrand(null)}
        onConfirm={() => {
          if (deletingBrand) deleteMutation.mutate(deletingBrand)
        }}
      />
      <CreateBrandModal
        open={createOpen}
        isPending={createMutation.isPending}
        error={createError}
        fieldErrors={createFieldErrors}
        onClearError={() => setCreateError(null)}
        onClose={() => setCreateOpen(false)}
        onSubmit={(input) => {
          createMutation.mutate(input)
        }}
      />
    </div>
  )
}
