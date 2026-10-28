import type { PageTitleBlockProps } from "../../types/dashboard"

export function PageTitleBlock({ data }: PageTitleBlockProps) {
  return (
    <div className="admin-page-title mb-[30px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-normal text-gray-800">{data.title}</h1>
          <p className="pt-[3px] text-base text-gray-500">{data.description}</p>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {data.actions.map((action) => (
            <button
              key={action}
              type="button"
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 shadow-sm transition-colors hover:bg-gray-50"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
