import type { Admin } from "../../generated/prisma/client.js";

declare global {
  namespace Express {
    interface Request {
      admin?: Admin;
    }
  }
}

export {};
