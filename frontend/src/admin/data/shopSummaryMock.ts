/**
 * Frontend-only placeholder data for the Shops summary section.
 *
 * The backend `Shop` model has no division column and orders/products are not
 * linked to a shop yet, so this aggregation is mocked on the client. When the
 * backend exposes a real summary endpoint (e.g. GET /admin/super/shops/summary)
 * swap this module for that API response — the component props already match
 * the intended shape.
 */

export type DivisionSummary = {
  /** Administrative division name (Bangladesh). */
  division: string
  /** Shops currently operating in this division. */
  shops: number
  /** Sales amount (BDT) recorded today. */
  salesToday: number
  /** Orders placed today. */
  ordersToday: number
}

export type TopSellingItem = {
  id: number
  name: string
  category: string
  unitsSold: number
  revenue: number
}

export type CategorySummary = {
  name: string
  /** Share of total units sold, 0–100. */
  share: number
  /** Hex colour used by the donut + legend. */
  color: string
}

export type TopShopSummary = {
  id: number
  name: string
  slug: string
  status: "active" | "trial" | "inactive"
  salesToday: number
  ordersToday: number
}

export type ShopSummaryData = {
  /** ISO timestamp of the last aggregation. */
  updatedAt: string
  /** Distinct SKUs across every tenant catalogue. */
  totalSkus: number
  divisions: DivisionSummary[]
  topItems: TopSellingItem[]
  categories: CategorySummary[]
  topShops: TopShopSummary[]
}

export const MOCK_SHOP_SUMMARY: ShopSummaryData = {
  updatedAt: new Date().toISOString(),
  totalSkus: 1840,
  divisions: [
    { division: "Dhaka", shops: 21, salesToday: 486500, ordersToday: 142 },
    { division: "Chattogram", shops: 10, salesToday: 214300, ordersToday: 63 },
    { division: "Sylhet", shops: 6, salesToday: 96800, ordersToday: 28 },
    { division: "Rajshahi", shops: 5, salesToday: 61200, ordersToday: 19 },
    { division: "Khulna", shops: 4, salesToday: 48900, ordersToday: 14 },
    { division: "Barishal", shops: 2, salesToday: 22400, ordersToday: 7 },
    { division: "Rangpur", shops: 2, salesToday: 18700, ordersToday: 6 },
    { division: "Mymensingh", shops: 1, salesToday: 9300, ordersToday: 3 },
  ],
  topItems: [
    {
      id: 1,
      name: "Ashwagandha Vitality Capsules",
      category: "Herbal Supplement",
      unitsSold: 412,
      revenue: 535600,
    },
    {
      id: 2,
      name: "Black Seed Honey Blend",
      category: "Wellness",
      unitsSold: 318,
      revenue: 381600,
    },
    {
      id: 3,
      name: "Jingseng Plus Tonic",
      category: "Vitality",
      unitsSold: 274,
      revenue: 411000,
    },
    {
      id: 4,
      name: "UltraHot Slim Tea",
      category: "Weight Management",
      unitsSold: 205,
      revenue: 225500,
    },
    {
      id: 5,
      name: "Ling Long Herbal Oil",
      category: "Traditional Medicine",
      unitsSold: 168,
      revenue: 168000,
    },
  ],
  categories: [
    { name: "Herbal Supplement", share: 46, color: "#00685f" },
    { name: "Wellness", share: 22, color: "#475569" },
    { name: "Weight Management", share: 14, color: "#b45309" },
    { name: "Vitality", share: 11, color: "#2563eb" },
    { name: "Traditional Medicine", share: 7, color: "#7c3aed" },
  ],
  topShops: [
    {
      id: 1,
      name: "Power Zenox",
      slug: "power-zenox",
      status: "active",
      salesToday: 268400,
      ordersToday: 78,
    },
    {
      id: 2,
      name: "Herbal Life BD",
      slug: "herbal-life-bd",
      status: "active",
      salesToday: 187900,
      ordersToday: 54,
    },
    {
      id: 3,
      name: "Nature's Own",
      slug: "natures-own",
      status: "active",
      salesToday: 121600,
      ordersToday: 36,
    },
    {
      id: 4,
      name: "Green Leaf Organics",
      slug: "green-leaf-organics",
      status: "active",
      salesToday: 89300,
      ordersToday: 27,
    },
    {
      id: 5,
      name: "Pure Herb Care",
      slug: "pure-herb-care",
      status: "trial",
      salesToday: 63700,
      ordersToday: 19,
    },
    {
      id: 6,
      name: "Sundarban Naturals",
      slug: "sundarban-naturals",
      status: "active",
      salesToday: 41200,
      ordersToday: 12,
    },
  ],
}
