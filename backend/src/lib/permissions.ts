export type PermissionMap = Record<string, string[]>;

/** Wildcard-aware check: *:* > resource:* > resource:action. */
export function hasPermission(
  permissions: PermissionMap | undefined,
  resource: string,
  action: string
): boolean {
  if (permissions?.["*"]?.includes("*")) return true;
  const actions = permissions?.[resource];
  return Boolean(actions?.includes("*") || actions?.includes(action));
}

export function hasAnyPermission(
  permissions: PermissionMap | undefined,
  checks: readonly (readonly [string, string])[]
): boolean {
  return checks.some(([resource, action]) =>
    hasPermission(permissions, resource, action)
  );
}
