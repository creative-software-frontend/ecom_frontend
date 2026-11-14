import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function getSidebarStats(_req: Request, res: Response) {
  try {
    // ভবিষ্যতে মাল্টি-টেন্যান্টে (Phase B) এখানে req.user.shopId দিয়ে ফিল্টার করবেন।
    // আপাতত যেহেতু Product এবং Order টেবিলে shopId কলাম নেই, তাই গ্লোবাল কাউন্ট আসছে।
    const [pendingOrders, totalProducts] = await Promise.all([
      prisma.order.count({ where: { status: "pending" } }),
      prisma.product.count({ where: { isActive: true } }),
    ]);

    return res.json({
      success: true,
      data: {
        pendingOrders,
        totalProducts,
      },
    });
  } catch (error) {
    console.error("Error fetching sidebar stats:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}
