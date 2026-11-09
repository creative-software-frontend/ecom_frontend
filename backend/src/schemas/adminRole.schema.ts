import { z } from "zod";

// Full list of modules a role can be granted actions on.
const ACTIONS = ["read", "create", "update", "delete", "*"] as const;
const ACTION_SCHEMA = z.enum(ACTIONS);

// Each module is optional. `.strict()` rejects unknown keys.
// Transform strips undefined keys so stored JSON stays minimal.
const permissionsSchema = z
  .object({
    products: z.array(ACTION_SCHEMA).optional(),
    orders: z.array(ACTION_SCHEMA).optional(),
    settings: z.array(ACTION_SCHEMA).optional(),
    coupons: z.array(ACTION_SCHEMA).optional(),
    pages: z.array(ACTION_SCHEMA).optional(),
    marketing: z.array(ACTION_SCHEMA).optional(),
    courier: z.array(ACTION_SCHEMA).optional(),
    users: z.array(ACTION_SCHEMA).optional(),
    roles: z.array(ACTION_SCHEMA).optional(),
    shops: z.array(ACTION_SCHEMA).optional(),
    audit: z.array(ACTION_SCHEMA).optional(),
  })
  .strict()
  .transform((obj) => {
    const cleaned: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) cleaned[k] = v;
    }
    return cleaned;
  });

export const createRoleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Minimum 3 characters")
    .max(50)
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers and underscore only"),
  displayName: z.string().trim().min(1).max(80),
  scope: z.enum(["platform", "shop"]),
  permissions: permissionsSchema,
  description: z.string().trim().max(500).optional(),
});

export const updateRoleSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  permissions: permissionsSchema.optional(),
  description: z.string().trim().max(500).optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
