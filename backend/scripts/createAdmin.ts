import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

const MIN_PASSWORD_LENGTH = 8;
const runtimeProcess = (globalThis as typeof globalThis & {
  process: {
    env: Record<string, string | undefined>;
    exitCode?: number;
  };
}).process;

async function main() {
  const email = runtimeProcess.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = runtimeProcess.env.ADMIN_PASSWORD;

  if (!email) {
    throw new Error("ADMIN_EMAIL is required");
  }

  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  const existing = await prisma.admin.findUnique({ where: { email } });

  if (existing) {
    throw new Error("An admin with this email already exists");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.create({
    data: { email, passwordHash },
  });

  console.log("Admin created successfully");
}

main()
  .catch((error: unknown) => {
    console.error(
      "Failed to create admin:",
      error instanceof Error ? error.message : "Unknown error",
    );
    runtimeProcess.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
