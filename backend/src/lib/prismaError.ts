import type { Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";

interface ErrorBody {
  success: false;
  message: string;
  errors?: Record<string, string>;
}

interface MappedError {
  status: number;
  body: ErrorBody;
}

function mapPrismaError(code: string): MappedError | null {
  switch (code) {
    case "P2002":
      return {
        status: 409,
        body: {
          success: false,
          message: "Slug already in use",
          errors: { slug: "This slug is already in use" },
        },
      };
    case "P2003":
      return {
        status: 409,
        body: {
          success: false,
          message:
            "This product has orders and cannot be deleted. Deactivate it instead.",
        },
      };
    case "P2025":
      return {
        status: 404,
        body: { success: false, message: "Product not found" },
      };
    default:
      return null;
  }
}

export function sendPrismaError(
  error: unknown,
  res: Response,
): Response | null {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return null;
  }

  const mapped = mapPrismaError(error.code);

  if (!mapped) {
    return null;
  }

  return res.status(mapped.status).json(mapped.body);
}
