import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Bell, Megaphone, Pin, Search, Tag } from "lucide-react"
import {
  shopNewsApi,
  shopNewsQueryKeys,
  type NewsCategory,
  type NewsItemDto,
} from "../api/newsApi"
import { ErrorState } from "../components/common/ErrorState"
import { LoadingState } from "../components/common/LoadingState"
import { useDebouncedValue } from "../hooks/useDebouncedValue"
import { getErrorMessage } from "../lib/errors"
import { relativeTime } from "../lib/formatTime"

const DHAKA_TIMEZONE = "Asia/Dhaka"

const dayFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  timeZone: DHAKA_TIMEZONE,
})
const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: DHAKA_TIMEZONE,
})
const yearFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  timeZone: DHAKA_TIMEZONE,
})

const categoryTabs: { id: NewsCategory | "all"; label: string }[] = [
  { id: "all", label: "All News" },
  { id: "charge", label: "Charges" },
  { id: "integration", label: "Integration" },
  { id: "notice", label: "Notices" },
  { id: "general", label: "General" },
]

const categoryLabels: Record<NewsCategory, string> = {
  charge: "Charge Update",
  integration: "Integration",
  notice: "Service Notice",
  general: "General",
}

function publishedDateParts(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return { day: "—", month: "—", year: "" }
  }
  return {
    day: dayFormatter.format(date),
    month: monthFormatter.format(date).toUpperCase(),
    year: yearFormatter.format(date),
  }
}

export default function NewsPage() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | "all">(
    "all"
  )
  const debouncedSearch = useDebouncedValue(search, 200)

  const newsQuery = useQuery({
    queryKey: shopNewsQueryKeys.list(),
    queryFn: ({ signal }) => shopNewsApi.list({}, signal),
  })

  const items = newsQuery.data?.items ?? []
  const totalPublished = newsQuery.data?.totalPublished ?? items.length

  const filteredNews = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    return items.filter((item: NewsItemDto) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        (item.description?.toLowerCase().includes(query) ?? false) ||
        categoryLabels[item.category].toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [items, selectedCategory, debouncedSearch])

  if (newsQuery.isLoading) {
    return (
      <LoadingState
        className="flex min-h-64 items-center justify-center text-sm text-(--text-muted)"
        ariaLabel="Loading news"
      >
        Loading announcements…
      </LoadingState>
    )
  }

  if (newsQuery.error) {
    return (
      <ErrorState
        className="m-6 rounded-md border border-(--border-light) bg-(--bg-surface) p-6 text-center"
        messageClassName="mb-3 text-sm text-(--text-muted)"
        buttonClassName="h-8 rounded-md bg-(--primary) px-3 text-sm font-medium text-white"
        message={getErrorMessage(newsQuery.error, "Could not load announcements.")}
        onRetry={() => void newsQuery.refetch()}
      />
    )
  }

  return (
    <div className="admin-dashboard-content min-w-0 space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-(--text-primary)">
              News & updates
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-(--primary-soft) px-2.5 py-0.5 text-xs font-semibold text-(--primary)">
              <Megaphone className="size-3" />
              {totalPublished} Announcements
            </span>
          </div>
          <p className="mt-1 text-xs text-(--text-muted) sm:text-sm">
            Platform announcements, feature updates, and service notices.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-(--text-muted)" />
          <input
            type="search"
            placeholder="Search news & notices..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 w-full rounded-lg border border-(--border-light) bg-(--bg-surface) pr-3 pl-9 text-xs text-(--text-primary) shadow-xs outline-none placeholder:text-(--text-muted) focus:border-(--primary) focus:ring-1 focus:ring-(--primary)"
          />
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categoryTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCategory(tab.id)}
            className={`shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 font-medium transition-colors ${
              selectedCategory === tab.id
                ? "bg-(--primary) text-white shadow-xs"
                : "border border-(--border-light) bg-(--bg-surface) text-(--text-muted) hover:bg-(--bg-surface-hover) hover:text-(--text-primary)"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-(--border-light) bg-(--bg-surface) py-14 text-center shadow-xs">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-(--bg-surface-hover) text-(--text-muted)">
              <Bell className="size-5 opacity-60" />
            </div>
            <p className="text-sm font-medium text-(--text-primary)">
              No news or updates found
            </p>
            <p className="mt-1 text-xs text-(--text-muted)">
              Try adjusting your search or category filter.
            </p>
          </div>
        ) : (
          filteredNews.map((news) => {
            const { day, month, year } = publishedDateParts(news.publishedAt)
            return (
              <article
                key={news.id}
                className="flex flex-col items-start gap-4 rounded-xl border border-(--border-light) bg-(--bg-surface) p-4 shadow-xs transition-all hover:border-(--border-hover) hover:shadow-sm sm:flex-row sm:p-5"
              >
                <div className="flex min-w-16 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-(--border-light) bg-(--bg-app) px-3 py-2 text-center shadow-2xs sm:min-w-17 sm:flex-col sm:gap-0 sm:py-2.5">
                  <span className="text-xl leading-none font-bold tracking-tight text-(--text-primary) sm:text-2xl">
                    {day}
                  </span>
                  <span className="text-[11px] leading-none font-bold tracking-wider text-(--text-muted) uppercase sm:mt-1">
                    {month}
                  </span>
                  <span className="text-[10px] leading-none text-(--text-muted) opacity-80 sm:mt-0.5">
                    {year}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-(--text-muted)">
                      {relativeTime(news.publishedAt)}
                    </span>
                    <span className="text-xs text-(--border-hover)">•</span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-(--bg-surface-hover) px-2 py-0.5 text-[10px] font-medium text-(--text-muted)">
                      <Tag className="size-2.5" />
                      {categoryLabels[news.category]}
                    </span>
                    {news.isPinned && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-(--primary-soft) px-2 py-0.5 text-[10px] font-semibold text-(--primary)">
                        <Pin className="size-2.5" />
                        Pinned
                      </span>
                    )}
                  </div>

                  <h2 className="text-sm leading-relaxed font-bold text-(--text-primary) sm:text-[15px]">
                    {news.title}
                  </h2>

                  {news.description && (
                    <p className="mt-2 text-xs leading-relaxed text-(--text-muted) sm:text-[13px]">
                      {news.description}
                    </p>
                  )}
                </div>
              </article>
            )
          })
        )}
      </div>
    </div>
  )
}
