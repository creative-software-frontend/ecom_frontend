import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";
import * as fs from "fs";
import * as path from "path";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST!,
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  database: process.env.DATABASE_NAME!,
  port: process.env.DATABASE_PORT ? Number(process.env.DATABASE_PORT) : 3306,
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const filePath = path.join(import.meta.dirname, "../src/data/products.json");
  console.log(filePath);
  if (!fs.existsSync(filePath)) {
    console.error("products.json file not found in src/data/");
    return;
  }

  const rawData = fs.readFileSync(filePath, "utf-8");
  const products = JSON.parse(rawData);

  console.log("Seeding products into database...");

  for (const p of products) {
    const slug = p.slug || p.id;

    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        slug: slug,
        name: p.name,
        brandName: p.brand_name || p.brandName || "Power Zenox",
        category: p.category || "Herbal Supplement",
        currentPrice: p.price?.current || p.currentPrice || 0,
        regularPrice: p.price?.regular || p.regularPrice || 0,
        discountPercent: p.price?.discount_percent || p.discountPercent || 0,
        inStock: p.in_stock ?? true,
        isActive: p.isActive ?? p.is_active ?? true,
        stockQuantity: p.stock_quantity || 100,
        images: p.images || [],
        orderFormConfig: p.order_form || null,
      },
    });
    console.log(`Synced product: ${p.name}`);
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
