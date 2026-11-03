import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "../src/constants/order.js";
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

interface ProductSeed {
  id?: string;
  slug?: string;
  name: string;
  brand_name?: string;
  brandName?: string;
  category?: string;
  price?: {
    current?: number;
    regular?: number;
    discount_percent?: number;
  };
  currentPrice?: number;
  regularPrice?: number;
  discountPercent?: number;
  in_stock?: boolean;
  is_active?: boolean;
  isActive?: boolean;
  stock_quantity?: number;
  images?: string[];
  // Kept loosely typed because it is stored as-is in a Prisma JSON column.
  order_form?: any;
}

interface OrderItemSeed {
  productSlug: string;
  quantity: number;
  unitPrice: number;
}

interface OrderSeed {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string | null;
  deliveryArea: string;
  deliveryCharge: number;
  subtotal?: number;
  total?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  createdAt?: string;
  items: OrderItemSeed[];
}

const ORDER_STATUS_SET = new Set<string>(ORDER_STATUSES);
const PAYMENT_STATUS_SET = new Set<string>(PAYMENT_STATUSES);

function readJsonFile<T>(relativePath: string): T {
  const filePath = path.join(import.meta.dirname, relativePath);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Seed file not found: ${filePath}`);
  }

  const rawData = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(rawData) as T;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }

  return value.trim();
}

function requireInteger(value: unknown, field: string, min = 0): number {
  if (!Number.isInteger(value) || (value as number) < min) {
    throw new Error(`${field} must be a whole number greater than or equal to ${min}`);
  }

  return value as number;
}

async function seedProducts() {
  const products = readJsonFile<ProductSeed[]>("../src/data/products.json");

  if (!Array.isArray(products)) {
    throw new Error("products.json must contain an array of products");
  }

  console.log(`Seeding ${products.length} product(s)...`);

  for (const p of products) {
    const slug = p.slug || p.id;

    if (!slug) {
      throw new Error(`Product "${p.name ?? "unknown"}" is missing a slug`);
    }

    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: p.name,
        brandName: p.brand_name || p.brandName || "Power Zenox",
        category: p.category || "Herbal Supplement",
        currentPrice: p.price?.current || p.currentPrice || 0,
        regularPrice: p.price?.regular || p.regularPrice || 0,
        discountPercent:
          p.price?.discount_percent || p.discountPercent || 0,
        inStock: p.in_stock ?? true,
        isActive: p.isActive ?? p.is_active ?? true,
        stockQuantity: p.stock_quantity || 100,
        images: p.images || [],
        orderFormConfig: p.order_form || null,
      },
    });

    console.log(`  Synced product: ${p.name}`);
  }
}

async function seedOrders() {
  const orders = readJsonFile<OrderSeed[]>("../src/data/orders.json");

  if (!Array.isArray(orders)) {
    throw new Error("orders.json must contain an array of orders");
  }

  if (orders.length === 0) {
    console.log("orders.json is empty; skipping order seeding.");
    return;
  }

  const products = await prisma.product.findMany({
    select: { id: true, slug: true, name: true },
  });
  const productBySlug = new Map(products.map((product) => [product.slug, product]));

  if (products.length === 0) {
    throw new Error(
      "No products found in the database. Seed products before seeding orders.",
    );
  }

  const seenOrderNumbers = new Set<string>();
  console.log(`Seeding ${orders.length} order(s)...`);

  for (const order of orders) {
    const orderNumber = requireString(
      order.orderNumber,
      "Order orderNumber",
    );

    if (seenOrderNumbers.has(orderNumber)) {
      throw new Error(`Duplicate order number in orders.json: ${orderNumber}`);
    }
    seenOrderNumbers.add(orderNumber);

    const customerName = requireString(
      order.customerName,
      `${orderNumber}.customerName`,
    );
    const customerPhone = requireString(
      order.customerPhone,
      `${orderNumber}.customerPhone`,
    );
    const customerAddress = requireString(
      order.customerAddress,
      `${orderNumber}.customerAddress`,
    );
    const deliveryArea = requireString(
      order.deliveryArea,
      `${orderNumber}.deliveryArea`,
    );
    const deliveryCharge = requireInteger(
      order.deliveryCharge,
      `${orderNumber}.deliveryCharge`,
    );

    const status = order.status ?? "pending";
    if (!ORDER_STATUS_SET.has(status)) {
      throw new Error(
        `${orderNumber}.status must be one of: ${ORDER_STATUSES.join(", ")}`,
      );
    }

    const paymentStatus = order.paymentStatus ?? "unpaid";
    if (!PAYMENT_STATUS_SET.has(paymentStatus)) {
      throw new Error(
        `${orderNumber}.paymentStatus must be one of: ${PAYMENT_STATUSES.join(", ")}`,
      );
    }

    const paymentMethod = order.paymentMethod ?? "cod";
    if (typeof paymentMethod !== "string" || paymentMethod.trim() === "") {
      throw new Error(`${orderNumber}.paymentMethod must be a non-empty string`);
    }

    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
    if (Number.isNaN(createdAt.getTime())) {
      throw new Error(`${orderNumber}.createdAt is not a valid date`);
    }

    if (!Array.isArray(order.items) || order.items.length === 0) {
      throw new Error(`${orderNumber} must contain at least one item`);
    }

    const items = order.items.map((item, index) => {
      const productSlug = requireString(
        item.productSlug,
        `${orderNumber}.items[${index}].productSlug`,
      );
      const product = productBySlug.get(productSlug);

      if (!product) {
        throw new Error(
          `${orderNumber} references unknown product slug "${productSlug}". ` +
            "Add it to products.json and seed products first.",
        );
      }

      const quantity = requireInteger(
        item.quantity,
        `${orderNumber}.items[${index}].quantity`,
        1,
      );
      const unitPrice = requireInteger(
        item.unitPrice,
        `${orderNumber}.items[${index}].unitPrice`,
      );

      return {
        productId: product.id,
        quantity,
        unitPrice,
        lineTotal: quantity * unitPrice,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
    const total = subtotal + deliveryCharge;

    if (order.subtotal !== undefined && order.subtotal !== subtotal) {
      throw new Error(
        `${orderNumber}.subtotal is ${order.subtotal}, but the items add up to ${subtotal}`,
      );
    }

    if (order.total !== undefined && order.total !== total) {
      throw new Error(
        `${orderNumber}.total is ${order.total}, but subtotal + deliveryCharge is ${total}`,
      );
    }

    const orderData = {
      customerName,
      customerPhone,
      customerAddress,
      notes: order.notes ?? null,
      deliveryArea,
      deliveryCharge,
      subtotal,
      total,
      paymentMethod: paymentMethod.trim(),
      paymentStatus,
      status,
      createdAt,
    };

    await prisma.order.upsert({
      where: { orderNumber },
      update: {
        ...orderData,
        items: {
          deleteMany: {},
          create: items,
        },
      },
      create: {
        orderNumber,
        ...orderData,
        items: {
          create: items,
        },
      },
    });

    console.log(
      `  Upserted order: ${orderNumber} (${items.length} item(s), ${status})`,
    );
  }
}

async function main() {
  await seedProducts();
  await seedOrders();

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
