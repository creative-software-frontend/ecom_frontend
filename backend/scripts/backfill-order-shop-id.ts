import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

const databaseUrl = new URL(requireEnv("DATABASE_URL"));

const adapter = new PrismaMariaDb({
  host: databaseUrl.hostname,
  port: databaseUrl.port ? Number(databaseUrl.port) : 3306,
  user: decodeURIComponent(databaseUrl.username),
  password: decodeURIComponent(databaseUrl.password),
  database: databaseUrl.pathname.replace(/^\//, ""),
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const shop = await prisma.shop.findFirst({
    where: {
      OR: [{ slug: "power-zenox" }, { name: "Power Zenox" }],
    },
    select: { id: true, name: true, slug: true },
  });

  if (!shop) {
    throw new Error("Power Zenox shop not found. Cannot backfill order shopId.");
  }

  const updatedCount = await prisma.$executeRaw`
    UPDATE \`orders\`
    SET \`shop_id\` = ${shop.id}
    WHERE \`shop_id\` IS NULL
  `;

  console.log(
    `Backfilled ${Number(updatedCount)} orders to shop ${shop.name} (${shop.slug}, id=${shop.id}).`,
  );
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
