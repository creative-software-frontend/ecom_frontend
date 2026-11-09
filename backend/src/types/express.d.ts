import type { Role, Shop, User } from "../../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      user?: User & { role: Role; shop: Shop | null };
      permissions?: Record<string, string[]>;
    }
  }
}

export {};
