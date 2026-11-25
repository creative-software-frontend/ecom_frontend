import { BD_DIVISIONS } from "../constants/division.js";
import { ORDER_STATUSES } from "../constants/order.js";
import { prisma } from "./prisma.js";

/* ================================================================
   Shared aggregation for the super-admin dashboard and shop summary.
   Revenue, sales and item metrics ignore cancelled/returned orders;
   the pipeline breakdown intentionally counts every status.
   ================================================================ */

const EXCLUDED_ORDER_STATUSES: string[] = ["cancelled", "returned"];
const CATEGORY_COLORS = [
  "#00685f",
  "#475569",
  "#b45309",
  "#2563eb",
  "#7c3aed",
] as const;
const TOP_SHOPS_LIMIT = 6;
const TOP_ITEMS_LIMIT = 5;
const TOP_CATEGORIES_LIMIT = 5;

const SHOP_STATUS_RANK: Record<string, number> = {
  active: 0,
  trial: 1,
  inactive: 2,
};

type ShopStatus = "active" | "trial" | "inactive";

export type CommerceAnalytics = {
  orderPipeline: {
    totalOrders: number;
    orderValue: number;
    unpaidAmount: number;
    estimatedProfit: number;
    countsByStatus: Record<(typeof ORDER_STATUSES)[number], number>;
  };
  productHealth: {
    totalSkus: number;
    active: number;
    blocked: number;
    lowStock: number;
    outOfStock: number;
  };
};

export type DivisionSummary = {
  division: string;
  shops: number;
  salesToday: number;
  ordersToday: number;
};

export type TopShopSummary = {
  id: number;
  name: string;
  slug: string;
  status: ShopStatus;
  salesToday: number;
  ordersToday: number;
};

export type TopSellingItem = {
  id: number;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
};

export type CategorySummary = {
  name: string;
  share: number;
  color: string;
};

export type ShopSummaryData = {
  updatedAt: string;
  totalSkus: number;
  divisions: DivisionSummary[];
  topShops: TopShopSummary[];
  topItems: TopSellingItem[];
  categories: CategorySummary[];
};

export type SuperAnalytics = {
  commerce: CommerceAnalytics;
  shopSummary: ShopSummaryData;
};

/** Start of the current commercial day in Asia/Dhaka (UTC+6). */
function getDhakaDayStart(now: Date): Date {
  const dhakaNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  return new Date(
    Date.UTC(
      dhakaNow.getUTCFullYear(),
      dhakaNow.getUTCMonth(),
      dhakaNow.getUTCDate(),
    ) - 6 * 60 * 60 * 1000,
  );
}

function toShopStatus(status: string): ShopStatus {
  return status === "active" || status === "trial" || status === "inactive"
    ? status
    : "inactive";
}

function buildCategories(
  unitsByCategory: Map<string, number>,
): CategorySummary[] {
  let totalUnits = 0;
  for (const units of unitsByCategory.values()) totalUnits += units;
  if (totalUnits === 0) return [];

  const ranked = [...unitsByCategory.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, TOP_CATEGORIES_LIMIT);

  return ranked.map(([name, units], index) => {
    let share = Math.round((units / totalUnits) * 100);
    if (index === ranked.length - 1) {
      const otherShares = ranked
        .slice(0, -1)
        .reduce((sum, entry) => sum + Math.round((entry[1] / totalUnits) * 100), 0);
      share = 100 - otherShares;
    }
    return {
      name,
      share: Math.max(0, share),
      color: CATEGORY_COLORS[index] ?? CATEGORY_COLORS[0] ?? "#00685f",
    };
  });
}

export async function getSuperAnalytics(): Promise<SuperAnalytics> {
  const now = new Date();
  const dayStart = getDhakaDayStart(now);
  const validOrderWhere = { status: { notIn: EXCLUDED_ORDER_STATUSES } };

  const [
    totalOrders,
    statusGroups,
    orderTotals,
    unpaidTotals,
    todayByShop,
    totalSkus,
    activeProducts,
    blockedProducts,
    lowStockProducts,
    outOfStockProducts,
    shops,
    validOrderItems,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: validOrderWhere,
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        ...validOrderWhere,
        paymentStatus: "unpaid",
      },
      _sum: { total: true },
    }),
    prisma.order.groupBy({
      by: ["shopId"],
      where: {
        ...validOrderWhere,
        createdAt: { gte: dayStart },
      },
      _count: { _all: true },
      _sum: { total: true },
    }),
    prisma.product.count(),
    prisma.product.count({
      where: { isActive: true, isBlocked: false },
    }),
    prisma.product.count({ where: { isBlocked: true } }),
    prisma.product.count({
      where: {
        isBlocked: false,
        stockQuantity: { gt: 0, lt: 5 },
      },
    }),
    prisma.product.count({
      where: { isBlocked: false, stockQuantity: 0 },
    }),
    prisma.shop.findMany({
      select: { id: true, name: true, slug: true, status: true, division: true },
    }),
    prisma.orderItem.findMany({
      where: { order: validOrderWhere },
      select: {
        quantity: true,
        lineTotal: true,
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            buyingPrice: true,
          },
        },
      },
    }),
  ]);

  const countsByStatus = Object.fromEntries(
    ORDER_STATUSES.map((status) => [
      status,
      statusGroups.find((group) => group.status === status)?._count._all ?? 0,
    ]),
  ) as CommerceAnalytics["orderPipeline"]["countsByStatus"];

  const todayByShopId = new Map<
    number,
    { salesToday: number; ordersToday: number }
  >(
    todayByShop.map((group) => [
      group.shopId,
      {
        salesToday: group._sum.total ?? 0,
        ordersToday: group._count._all,
      },
    ]),
  );

  const divisionStats = new Map<string, DivisionSummary>(
    BD_DIVISIONS.map((division) => [
      division,
      { division, shops: 0, salesToday: 0, ordersToday: 0 },
    ]),
  );

  const topShops: TopShopSummary[] = [];
  for (const shop of shops) {
    const today = todayByShopId.get(shop.id) ?? {
      salesToday: 0,
      ordersToday: 0,
    };
    const division = (BD_DIVISIONS as readonly string[]).includes(shop.division)
      ? shop.division
      : "Dhaka";
    const stats = divisionStats.get(division);
    if (stats) {
      stats.shops += 1;
      stats.salesToday += today.salesToday;
      stats.ordersToday += today.ordersToday;
    }
    topShops.push({
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      status: toShopStatus(shop.status),
      ...today,
    });
  }

  const divisions = [...divisionStats.values()].sort(
    (a, b) => b.shops - a.shops || b.salesToday - a.salesToday,
  );

  const rankedShops = topShops
    .sort(
      (a, b) =>
        b.salesToday - a.salesToday ||
        b.ordersToday - a.ordersToday ||
        (SHOP_STATUS_RANK[a.status] ?? 3) - (SHOP_STATUS_RANK[b.status] ?? 3) ||
        a.id - b.id,
    )
    .slice(0, TOP_SHOPS_LIMIT);

  const itemsById = new Map<number, TopSellingItem>();
  const unitsByCategory = new Map<string, number>();
  let estimatedProfit = 0;

  for (const item of validOrderItems) {
    const product = item.product;
    if (product.buyingPrice !== null) {
      estimatedProfit += item.lineTotal - product.buyingPrice * item.quantity;
    }

    const aggregate = itemsById.get(product.id);
    if (aggregate) {
      aggregate.unitsSold += item.quantity;
      aggregate.revenue += item.lineTotal;
    } else {
      itemsById.set(product.id, {
        id: product.id,
        name: product.name,
        category: product.category,
        unitsSold: item.quantity,
        revenue: item.lineTotal,
      });
    }

    unitsByCategory.set(
      product.category,
      (unitsByCategory.get(product.category) ?? 0) + item.quantity,
    );
  }

  const topItems = [...itemsById.values()]
    .sort((a, b) => b.unitsSold - a.unitsSold || a.id - b.id)
    .slice(0, TOP_ITEMS_LIMIT);

  return {
    commerce: {
      orderPipeline: {
        totalOrders,
        orderValue: orderTotals._sum.total ?? 0,
        unpaidAmount: unpaidTotals._sum.total ?? 0,
        estimatedProfit,
        countsByStatus,
      },
      productHealth: {
        totalSkus,
        active: activeProducts,
        blocked: blockedProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
      },
    },
    shopSummary: {
      updatedAt: now.toISOString(),
      totalSkus,
      divisions,
      topShops: rankedShops,
      topItems,
      categories: buildCategories(unitsByCategory),
    },
  };
}
