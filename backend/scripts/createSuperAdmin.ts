import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

const MIN_PASSWORD_LENGTH = 12;

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Super Admin";

  if (!email) throw new Error("ADMIN_EMAIL is required");
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
  }

  // Must exist — roles are seeded by the migration.
  const superAdminRole = await prisma.role.findUnique({
    where: { name: "super_admin" },
  });
  if (!superAdminRole) {
    throw new Error(
      "super_admin role not found. Run the migration seed first.",
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Idempotent: if user exists, ensure they are super admin.
    if (existing.roleId !== superAdminRole.id) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { roleId: superAdminRole.id, shopId: null, status: "active" },
      });
      console.log("Promoted existing user to super_admin:", email);
    } else {
      console.log("Super admin already exists:", email);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      roleId: superAdminRole.id,
      shopId: null,
      status: "active",
    },
  });
  console.log("Super admin created successfully");
}

main()
  .catch((error: unknown) => {
    console.error(
      "Failed to create super admin:",
      error instanceof Error ? error.message : "Unknown error",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
