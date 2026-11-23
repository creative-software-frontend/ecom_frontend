import { useMemo, useState } from "react"
import { Bell, Calendar, Megaphone, Search, Tag } from "lucide-react"

export type NewsItem = {
  id: string
  day: string
  month: string
  year: string
  timeAgo: string
  title: string
  description?: string
  category?: "charge" | "integration" | "notice" | "general"
  categoryLabel?: string
  isPinned?: boolean
}

const INITIAL_NEWS: NewsItem[] = [
  {
    id: "news-1",
    day: "19",
    month: "APR",
    year: "2026",
    timeAgo: "7 months ago",
    title:
      "21 Apr 2026 থেকে ডেলিভারি চার্জ +৫ টাকা যোগ হবে। জ্বালানি ও অপারেশন খরচ বৃদ্ধির কারণে। ধন্যবাদ।",
    category: "charge",
    categoryLabel: "Charge Update",
  },
  {
    id: "news-2",
    day: "3",
    month: "MAR",
    year: "2025",
    timeAgo: "1 year ago",
    title:
      "ওয়েবহুক সার্ভিস ইন্টিগ্রেশনে গুরুত্বপূর্ণ আপডেট এসেছে। যারা এই সার্ভিস ব্যবহার করছেন দয়া করে Webhook Integration Documentaion চেক করবেন।",
    category: "integration",
    categoryLabel: "Integration",
  },
  {
    id: "news-3",
    day: "1",
    month: "MAR",
    year: "2025",
    timeAgo: "1 year ago",
    title: "Extra 10 tk will be added from March 8 to March 29, 2025.",
    category: "charge",
    categoryLabel: "Notice",
  },
  {
    id: "news-4",
    day: "4",
    month: "JAN",
    year: "2025",
    timeAgo: "1 year ago",
    title:
      "পার্সেল ইনফরমেশন এন্ট্রি করে দেয়া পার্সেলে অবশ্যই ইউজার আইডির সাথে ন্যূনতম পার্সেল আইডি বা ইনভয়েস বা কাস্টমার ফোন নাম্বার অবশ্যই সংযুক্ত করে দেয়ার অনুরোধ রইলো।",
    description:
      "পার্সেল ইনফরমেশন এন্ট্রি করে দেয়া পার্সেলে অবশ্যই ইউজার আইডির সাথে ন্যূনতম পার্সেল আইডি বা ইনভয়েস বা কাস্টমার ফোন নাম্বার অবশ্যই সংযুক্ত করে দেয়ার অনুরোধ রইলো। পার্সেল এন্ট্রি করা সম্ভব হবে না।",
    category: "notice",
    categoryLabel: "Service Notice",
  },
]

export default function NewsPage() {
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = useMemo(() => {
    return [
      { id: "all", label: "All News" },
      { id: "charge", label: "Charges" },
      { id: "integration", label: "Integration" },
      { id: "notice", label: "Notices" },
    ]
  }, [])

  const filteredNews = useMemo(() => {
    return INITIAL_NEWS.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory
      const query = search.toLowerCase().trim()
      const matchesSearch =
        !query ||
        item.title.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.categoryLabel &&
          item.categoryLabel.toLowerCase().includes(query))
      return matchesCategory && matchesSearch
    })
  }, [search, selectedCategory])

  return (
    <div className="admin-dashboard-content min-w-0 space-y-6 p-4 sm:p-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-(--text-primary) tracking-tight">
              News & updates
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Megaphone className="size-3" />
              {INITIAL_NEWS.length} Announcements
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-(--text-muted)">
            Announcements from Steadfast: charge changes, new features and
            service notices.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-(--text-muted)" />
          <input
            type="search"
            placeholder="Search news & notices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-(--border-light) bg-white pl-9 pr-3 text-xs text-(--text-primary) outline-none placeholder:text-(--text-muted) focus:border-primary focus:ring-1 focus:ring-primary shadow-xs"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-full px-3.5 py-1.5 font-medium transition-colors cursor-pointer shrink-0 ${
              selectedCategory === cat.id
                ? "bg-primary text-white shadow-xs"
                : "border border-(--border-light) bg-white text-(--text-muted) hover:bg-(--bg-surface-hover) hover:text-(--text-primary)"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* News Cards List */}
      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-(--border-light) bg-white py-14 text-center shadow-xs">
            <div className="flex size-12 items-center justify-center rounded-full bg-gray-100 text-(--text-muted) mb-3">
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
          filteredNews.map((news) => (
            <div
              key={news.id}
              className="group flex flex-col sm:flex-row items-start gap-4 rounded-xl border border-(--border-light) bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-gray-300 hover:shadow-sm"
            >
              {/* Date Box */}
              <div className="flex sm:flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50/70 px-3 py-2 sm:py-2.5 text-center min-w-16 sm:min-w-[68px] shrink-0 gap-1.5 sm:gap-0 shadow-2xs">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-(--text-primary) leading-none">
                  {news.day}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-(--text-muted) leading-none sm:mt-1">
                  {news.month}
                </span>
                <span className="text-[10px] text-(--text-muted) opacity-80 leading-none sm:mt-0.5">
                  {news.year}
                </span>
              </div>

              {/* Main Content Area */}
              <div className="min-w-0 flex-1">
                {/* Meta header */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-(--text-muted) font-medium">
                    {news.timeAgo}
                  </span>
                  {news.categoryLabel && (
                    <>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-(--text-muted)">
                        <Tag className="size-2.5" />
                        {news.categoryLabel}
                      </span>
                    </>
                  )}
                </div>

                {/* News Title / Primary Statement */}
                <h2 className="text-sm sm:text-[15px] font-bold text-(--text-primary) leading-relaxed">
                  {news.title}
                </h2>

                {/* News Description / Sub-content */}
                {news.description && (
                  <p className="mt-2 text-xs sm:text-[13px] text-(--text-muted) leading-relaxed">
                    {news.description}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
