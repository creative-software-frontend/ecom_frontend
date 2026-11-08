import "dotenv/config";
// @ts-ignore Node.js types may not be configured in this project.
import { readFile } from "node:fs/promises";
import { prisma } from "../src/lib/prisma.js";

// Legacy store.json shape (what readJsonFile returned previously).
type LegacyStoreSettings = {
  name?: string;
  url?: string;
  tagline?: string;
  currency?: string;
  currency_symbol?: string;
  language?: string;
  contact?: { phone?: string; whatsapp?: string };
  delivery?: {
    method?: string;
    note?: string;
    free_delivery?: boolean;
    delivery_charge?: number;
  };
};

// Location is the same as db.service.ts used previously.
const STORE_JSON_PATH = new URL("../src/data/store.json", import.meta.url);

async function loadLegacy(): Promise<LegacyStoreSettings> {
  try {
    const raw = await readFile(STORE_JSON_PATH, "utf-8");
    return JSON.parse(raw) as LegacyStoreSettings;
  } catch {
    // File missing -> return empty, we'll fall back to defaults.
    return {};
  }
}

async function main() {
  const legacy = await loadLegacy();

  const name = legacy.name ?? "Power Zenox";
  const tagline =
    legacy.tagline ?? "Natural Herbal Health & Wellness Solutions";
  const phone = legacy.contact?.phone ?? "01712345678";
  const whatsapp = legacy.contact?.whatsapp ?? phone;

  // Upsert id=1 — repeat runs are safe (idempotent).
  const row = await prisma.storeSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name,
      tagline,
      description: "",
      logo: null,
      phone,
      phone2: null,
      whatsapp,
      whatsapp2: null,
      email: "support@powerzenox.com",
      address: "Dhaka, Bangladesh",
      googleMapsUrl: null,
      facebook: null,
      instagram: null,
      youtube: null,
      tiktok: null,
    },
  });

  console.log("✅ StoreSettings seeded:", {
    id: row.id,
    name: row.name,
    phone: row.phone,
  });

  // Seed empty singletons for the other settings models (all defaults).
  await Promise.all([
    prisma.storefrontSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    }),
    prisma.orderSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    }),
    prisma.marketingSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1 },
    }),
  ]);
  console.log("✅ Empty singletons seeded (storefront, order, marketing)");
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);

    const globalWithProcess = globalThis as typeof globalThis & {
      process?: { exit?: (code?: number) => void };
    };

    if (globalWithProcess.process?.exit) {
      globalWithProcess.process.exit(1);
    }
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
