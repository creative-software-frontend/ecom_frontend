import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

const LOW_STOCK_THRESHOLD = 5;

function formatRelativeTime(date: Date, now: Date): string {
  const ms = now.getTime() - date.getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${mins % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDateRange(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  });
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export async function getDashboard(_req: Request, res: Response) {
  try {
    const now = new Date();

    // আজকের শুরু
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    // গতকালের শুরু
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    // এই মাসের শুরু
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // ৭ দিন আগে
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      yesterdayCount,
      pendingCount,
      oldestPending,
      deliveredAgg,
      lowStock,
      pendingList,
      recentOrders,
      shippedOrders,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: startOfToday } },
        select: { paymentMethod: true },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: startOfYesterday, lt: startOfToday },
        },
      }),
      prisma.order.count({ where: { status: "pending" } }),
      prisma.order.findFirst({
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
        select: { createdAt: true },
      }),
      prisma.order.aggregate({
        where: {
          status: "delivered",
          createdAt: { gte: startOfMonth },
        },
        _sum: { total: true },
        _count: { _all: true },
      }),
      prisma.product.findMany({
        where: {
          isActive: true,
          stockQuantity: { lt: LOW_STOCK_THRESHOLD },
        },
        select: { name: true, stockQuantity: true },
        orderBy: { stockQuantity: "asc" },
      }),
      prisma.order.findMany({
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
        take: 5,
        include: {
          items: {
            include: { product: { select: { name: true } } },
          },
        },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true, total: true },
      }),
      prisma.order.findMany({
        where: { status: "shipped" },
        select: { deliveryArea: true, total: true, paymentStatus: true },
      }),
    ]);

    // আজকের payment method breakdown
    let cod = 0;
    let bkash = 0;
    for (const o of todayOrders) {
      if (o.paymentMethod.toLowerCase() === "cod") cod += 1;
      else bkash += 1;
    }
    const todayCount = todayOrders.length;
    const changeValue = todayCount - yesterdayCount;
    const change =
      changeValue === 0
        ? "No change vs yesterday"
        : changeValue > 0
          ? `+${changeValue} vs yesterday`
          : `${changeValue} vs yesterday`;

    // সবচেয়ে পুরনো pending
    let oldestTime = "No pending orders";
    if (oldestPending) {
      oldestTime = formatRelativeTime(oldestPending.createdAt, new Date());
    }

    // সাপ্তাহিক চার্ট
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      dayMap.set(d.toISOString().slice(0, 10), 0);
    }
    let totalValue = 0;
    for (const o of recentOrders) {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      if (dayMap.has(key)) {
        dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
      }
      totalValue += o.total;
    }
    const todayKey = now.toISOString().slice(0, 10);
    const days = Array.from(dayMap.entries()).map(([key, count]) => ({
      day: dayNames[new Date(key).getDay()],
      count,
      active: key === todayKey,
    }));
    const totalOrders = recentOrders.length;
    const dailyAverage =
      totalOrders > 0 ? Number((totalOrders / 7).toFixed(1)) : 0;

    // কুরিয়ার সারাংশ (shipped অর্ডার থেকে derive করা)
    let insideDhaka = 0;
    let outsideDhaka = 0;
    let totalCod = 0;
    for (const o of shippedOrders) {
      if (o.deliveryArea.toLowerCase().includes("inside")) insideDhaka += 1;
      else outsideDhaka += 1;
      if (o.paymentStatus === "unpaid") totalCod += o.total;
    }

    const deliveredAmount = deliveredAgg._sum.total ?? 0;
    const deliveredCount = deliveredAgg._count._all;
    const avgPerOrder =
      deliveredCount > 0 ? Math.round(deliveredAmount / deliveredCount) : 0;

    return res.status(200).json({
      success: true,
      data: {
        metrics: {
          newOrdersToday: { count: todayCount, change, cod, bkash },
          waitingConfirmation: { count: pendingCount, oldestTime },
          deliveredRevenueMonth: {
            amount: deliveredAmount,
            parcelCount: deliveredCount,
            avgPerOrder,
          },
          lowStockProducts: {
            count: lowStock.length,
            alertText: lowStock[0]
              ? `${lowStock[0].name} (${lowStock[0].stockQuantity} left)`
              : "All products well-stocked",
          },
        },
        pendingVerificationOrders: pendingList.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          placedTime: formatRelativeTime(new Date(o.createdAt), now),
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          deliveryArea: o.deliveryArea,
          itemSummary: o.items
            .map((i) => `${i.product.name} × ${i.quantity}`)
            .join(", "),
        })),
        weeklyChart: {
          days,
          totalOrders,
          totalValue,
          dailyAverage,
          dateRange: formatDateRange(sevenDaysAgo, now),
        },
        courierSummary: {
          readyForPickup: shippedOrders.length,
          insideDhaka,
          outsideDhaka,
          totalCod,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
