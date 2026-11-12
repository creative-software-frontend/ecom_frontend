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

const roleDisplayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required")
  .max(80)
  .regex(
    /^[\x20-\x7E]+$/,
    "Use English letters and standard ASCII characters only",
  );

function toRoleName(displayName: string) {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export const createRoleSchema = z
  .object({
    displayName: roleDisplayNameSchema,
    scope: z.enum(["platform", "shop"]),
    permissions: permissionsSchema,
    description: z.string().trim().max(500).optional(),
  })
  .superRefine(({ displayName }, ctx) => {
    const name = toRoleName(displayName);
    if (name.length < 3 || name.length > 50) {
      ctx.addIssue({
        code: "custom",
        path: ["displayName"],
        message:
          "Display name must produce an internal name between 3 and 50 characters",
      });
    }
  })
  .transform((input) => ({
    ...input,
    name: toRoleName(input.displayName),
  }));

export const updateRoleSchema = z.object({
  displayName: roleDisplayNameSchema.optional(),
  permissions: permissionsSchema.optional(),
  description: z.string().trim().max(500).optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
