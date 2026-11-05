import { ImageOff } from "lucide-react"
import { useState } from "react"
import DataTable, { type TableColumn } from "react-data-table-component"
import { StatusBadge } from "../common/StatusBadge"
import { formatTaka } from "../../lib/orderStatus"
import type { Product } from "../../types/product"
import { getProductStockStatus } from "./productCatalog"
import { tableCustomStyles } from "@/admin/lib/dataTableStyles"

type ProductCatalogTableProps = {
  products: Product[]
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const productColumns: TableColumn<Product>[] = [
  {
    name: "Product Info & Slug",
    selector: (product) => product.name,
    minWidth: "230px",
    cell: (product) => (
      <div className="flex min-w-0 items-center gap-2.5 py-2">
        <ProductThumbnail product={product} />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">
            {product.name}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">
            {product.brandName}
          </p>
          <p className="mt-0.5 truncate font-mono text-[10px] text-primary">
            {product.slug}
          </p>
        </div>
      </div>
    ),
  },
  {
    name: "Category",
    selector: (product) => product.category,
    minWidth: "130px",
    cell: (product) => (
      <span className="inline-flex max-w-48 rounded-full bg-muted px-2 py-1 text-[10px] leading-tight text-foreground">
        {product.category}
      </span>
    ),
  },
  {
    name: "Pricing (BDT)",
    selector: (product) => product.currentPrice,
    minWidth: "140px",
    cell: (product) => {
      const hasDiscount = product.regularPrice > product.currentPrice
      return (
        <div>
          <p className="text-xs font-semibold whitespace-nowrap text-foreground tabular-nums">
            {formatTaka(product.currentPrice)}
            {hasDiscount ? (
              <span className="ml-1 rounded bg-(--status-pending-bg) px-1 py-0.5 text-[9px] font-bold text-(--status-pending-text)">
                -{product.discountPercent}%
              </span>
            ) : null}
          </p>
          {hasDiscount ? (
            <p className="text-[10px] text-muted-foreground tabular-nums line-through">
              {formatTaka(product.regularPrice)}
            </p>
          ) : null}
        </div>
      )
    },
  },
  {
    name: "Stock Level",
    selector: (product) => product.stockQuantity,
    minWidth: "140px",
    cell: (product) => {
      const stockStatus = getProductStockStatus(product.stockQuantity)
      return (
        <div>
          <p className="text-xs font-semibold whitespace-nowrap text-foreground tabular-nums">
            {product.stockQuantity} units
          </p>
          <StatusBadge
            variant={
              stockStatus === "in_stock"
                ? "in-stock"
                : stockStatus === "low_stock"
                  ? "low-stock"
                  : "out-of-stock"
            }
            label={
              stockStatus === "in_stock"
                ? "In stock"
                : stockStatus === "low_stock"
                  ? "Low stock"
                  : "Out of stock"
            }
            className="mt-0.5 justify-start! px-1.5! py-0! text-[10px]!"
          />
        </div>
      )
    },
  },
  {
    name: "Status",
    selector: (product) => product.isActive,
    minWidth: "100px",
    cell: (product) => (
      <StatusBadge
        variant={product.isActive ? "active" : "inactive"}
        label={product.isActive ? "Active" : "Inactive"}
        className="rounded-full! px-2! py-0.5! text-[10px]!"
      />
    ),
  },
]

function ProductThumbnail({ product }: { product: Product }) {
  const imageUrl = product.images[0]
  const [failedUrl, setFailedUrl] = useState<string | null>(null)

  if (!imageUrl || failedUrl === imageUrl) {
    return (
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
        aria-label="Product image unavailable"
      >
        <ImageOff className="size-4" aria-hidden="true" />
      </span>
    )
  }

  return (
    <img
      className="size-10 shrink-0 rounded-md border border-border object-cover"
      src={imageUrl}
      alt={`${product.name} product`}
      loading="lazy"
      onError={() => setFailedUrl(imageUrl)}
    />
  )
}

export function ProductCatalogTable({
  products,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: ProductCatalogTableProps) {
  return (
    <>
      <DataTable
        ariaLabel="Product catalog"
        keyField="id"
        columns={productColumns}
        data={products}
        customStyles={tableCustomStyles}
        selectableRows
        selectableRowsHighlight
        responsive
        pagination
        paginationServer
        paginationTotalRows={total}
        paginationDefaultPage={page}
        paginationPerPage={pageSize}
        paginationRowsPerPageOptions={[10, 20, 50]}
        onChangePage={onPageChange}
        onChangeRowsPerPage={(nextPageSize) => onPageSizeChange(nextPageSize)}
        noDataComponent={
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            <p className="font-medium">No products found.</p>
            <p className="mt-1 text-xs">Try changing your search or filters.</p>
          </div>
        }
      />
    </>
  )
}
