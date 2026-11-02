type PaginationProps = {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const showFrom = total === 0 ? 0 : (page - 1) * pageSize + 1
  const showTo = Math.min(page * pageSize, total)

  if (total === 0) return null

  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 sm:px-6">
      <p className="text-sm text-gray-500">
        Showing {showFrom}–{showTo} of {total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </footer>
  )
}
