import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
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
import { ErrorState } from "../../components/common/ErrorState"
import { InlineNotice } from "../../components/common/InlineNotice"
import { LoadingState } from "../../components/common/LoadingState"
import { useDebouncedValue } from "../../hooks/useDebouncedValue"
import { ApiError } from "../../api/client"
import { categoriesApi, categoryQueryKeys } from "../../api/catalogApi"
import { getErrorMessage } from "../../lib/errors"
import type {
  Category,
  CategoryLevelFilter,
  CategoryCounts,
  CategoryWriteInput,
  CatalogStatusFilter,
} from "../../types/catalog"
import { CreateCategoryModal } from "@/admin/components/shop-admin/CreateCategoryModal"

type Notice = { tone: "success" | "error"; message: string } | null

const EMPTY_COUNTS: CategoryCounts = {
  total: 0,
  parents: 0,
  subcategories: 0,
  active: 0,
  inactive: 0,
  linkedProducts: 0,
  empty: 0,
}

function csvCell(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function downloadCategoriesCsv(items: Category[]) {
  const headers = [
    "Name",
    "Slug",
    "Level",
    "Parent",
    "Products",
    "Status",
    "Description",
  ]
  const rows = items.map((category) => [
    category.name,
    category.slug,
    category.parentId === null ? "Category" : "Subcategory",
    category.parentName ?? "",
    category.productCount,
    category.isActive ? "Active" : "Inactive",
    category.description ?? "",
  ])
  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `categories-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function fieldErrors(error: unknown): Record<string, string> | null {
  return error instanceof ApiError && error.fieldErrors
    ? error.fieldErrors
    : null
}

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 300)
  const [status, setStatus] = useState<CatalogStatusFilter>("all")
  const [level, setLevel] = useState<CategoryLevelFilter>("all")
  const [notice, setNotice] = useState<Notice>(null)

  const [createOpen, setCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createFieldErrors, setCreateFieldErrors] = useState<
    Record<string, string> | null
  >(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [editFieldErrors, setEditFieldErrors] = useState<
    Record<string, string> | null
  >(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  )
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const params = useMemo(
    () => ({ q: debouncedSearch, status, level }),
    [debouncedSearch, status, level]
  )
  const categoriesQuery = useQuery({
    queryKey: categoryQueryKeys.list(params),
    queryFn: ({ signal }) => categoriesApi.list(params, signal),
  })

  // Unfiltered top-level list for the "Parent Category" selects.
  const parentParams = useMemo(() => ({ level: "parent" as const }), [])
  const parentsQuery = useQuery({
    queryKey: categoryQueryKeys.list(parentParams),
    queryFn: ({ signal }) => categoriesApi.list(parentParams, signal),
  })

  const invalidateCategories = () =>
    queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all })

  const createMutation = useMutation({
    mutationFn: (input: CategoryWriteInput) => categoriesApi.create(input),
    onSuccess: (category) => {
      void invalidateCategories()
      setCreateOpen(false)
      setCreateError(null)
      setCreateFieldErrors(null)
      setNotice({ tone: "success", message: `"${category.name}" was added.` })
    },
    onError: (error) => {
      setCreateError(getErrorMessage(error, "Could not create the category."))
      setCreateFieldErrors(fieldErrors(error))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      category,
      input,
    }: {
      category: Category
      input: CategoryWriteInput
    }) => categoriesApi.update(category.id, input),
    onSuccess: (category) => {
      void invalidateCategories()
      setEditingCategory(null)
      setEditError(null)
      setEditFieldErrors(null)
      setNotice({ tone: "success", message: `"${category.name}" was updated.` })
    },
    onError: (error) => {
      setEditError(getErrorMessage(error, "Could not update the category."))
      setEditFieldErrors(fieldErrors(error))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (category: Category) => categoriesApi.remove(category.id),
    onSuccess: (_, category) => {
      void invalidateCategories()
      setDeletingCategory(null)
      setDeleteError(null)
      setNotice({
        tone: "success",
        message: `"${category.name}" was deleted.`,
      })
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Could not delete the category.")
      setDeleteError(message)
      setNotice({ tone: "error", message })
    },
  })

  const categories = categoriesQuery.data?.items ?? []
  const parentOptions = (parentsQuery.data?.items ?? [])
    .filter((category) => category.parentId === null)
    .map((category) => ({ id: category.id, name: category.name }))
  const counts = categoriesQuery.data?.counts ?? EMPTY_COUNTS

  const columns: TableColumn<Category>[] = [
    {
      name: "CATEGORY NAME",
      minWidth: "280px",
      cell: (row) => (
        <div className={`py-2 ${row.parentId === null ? "" : "pl-5"}`}>
          <div className="flex flex-wrap items-center gap-2">
            {row.parentId !== null && (
              <FolderTree className="size-3.5 text-(--text-muted)" />
            )}
            <p className="text-sm font-semibold text-(--text-primary)">
              {row.name}
            </p>
            {row.parentId !== null && (
              <StatusBadge
                variant="info"
                label={`Subcategory of ${row.parentName ?? `#${row.parentId}`}`}
              />
            )}
          </div>
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
                  setEditError(null)
                  setEditFieldErrors(null)
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
                  setDeleteError(null)
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

  if (categoriesQuery.isLoading || parentsQuery.isLoading) {
    return (
      <LoadingState
        className="flex min-h-64 items-center justify-center text-sm text-(--text-muted)"
        ariaLabel="Loading categories"
      >
        Loading categories...
      </LoadingState>
    )
  }

  const queryError = categoriesQuery.error ?? parentsQuery.error
  if (queryError) {
    const permissionError =
      queryError instanceof ApiError && queryError.status === 403
    return (
      <ErrorState
        className="m-6 rounded-md border border-(--border-light) bg-(--bg-surface) p-6 text-center"
        messageClassName="mb-3 text-sm text-(--text-muted)"
        buttonClassName="h-8 rounded-md bg-(--primary) px-3 text-sm font-medium text-white"
        message={
          permissionError
            ? "Only shop administrators can manage categories."
            : getErrorMessage(queryError, "Could not load categories.")
        }
        onRetry={() => {
          void categoriesQuery.refetch()
          void parentsQuery.refetch()
        }}
      />
    )
  }

  return (
    <div className="min-w-0 space-y-3 p-4 md:p-5">
      <CatalogPageHeader
        title="Categories"
        subtitle="Organize your catalog into categories and subcategories"
        badgeText={`${counts.total} Categories`}
        onExport={() => downloadCategoriesCsv(categories)}
        exportDisabled={categories.length === 0}
        onAdd={() => {
          setCreateError(null)
          setCreateFieldErrors(null)
          setCreateOpen(true)
        }}
        addLabel="Add Category"
      />

      <CatalogMetricsWrapper>
        <MetricCard
          label="Total Categories"
          value={String(counts.total)}
          detail={`${counts.parents} categories · ${counts.subcategories} subcategories`}
          icon={FolderTree}
          tone="teal"
        />
        <MetricCard
          label="Active Categories"
          value={String(counts.active)}
          detail="Visible on site"
          icon={Activity}
          tone="teal"
        />
        <MetricCard
          label="Categorized Products"
          value={String(counts.linkedProducts)}
          detail="Total assignments"
          icon={Package}
          tone="indigo"
        />
        <MetricCard
          label="Empty Categories"
          value={String(counts.empty)}
          detail="Needs attention"
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
            {
              value: level,
              onChange: (value) => setLevel(value as CategoryLevelFilter),
              placeholder: "All Levels",
              options: [
                { label: "Categories only", value: "parent" },
                { label: "Subcategories only", value: "subcategory" },
              ],
            },
          ]}
        />
        <DataTable
          columns={columns}
          data={categories}
          customStyles={adminDataTableStyles}
          progressPending={categoriesQuery.isFetching}
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
        parentOptions={parentOptions}
        isPending={updateMutation.isPending}
        error={editError}
        fieldErrors={editFieldErrors}
        onClearError={() => setEditError(null)}
        onClose={() => setEditingCategory(null)}
        onSubmit={(input) => {
          if (editingCategory) {
            updateMutation.mutate({ category: editingCategory, input })
          }
        }}
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
        isPending={deleteMutation.isPending}
        errorMessage={deleteError}
        onCancel={() => setDeletingCategory(null)}
        onConfirm={() => {
          if (deletingCategory) deleteMutation.mutate(deletingCategory)
        }}
      />
      <CreateCategoryModal
        open={createOpen}
        parentOptions={parentOptions}
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
