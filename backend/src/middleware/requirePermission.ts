import type { NextFunction, Request, Response } from "express";
import {
  hasAnyPermission,
  hasPermission,
  type PermissionMap,
} from "../lib/permissions.js";

function deny(res: Response) {
  return res.status(403).json({
    success: false,
    message: "You do not have permission to perform this action.",
  });
}

export function requirePermission(resource: string, action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!hasPermission(req.permissions as PermissionMap | undefined, resource, action)) {
      return deny(res);
    }
    return next();
  };
}

export function requireAnyPermission(
  checks: readonly (readonly [string, string])[]
) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!hasAnyPermission(req.permissions as PermissionMap | undefined, checks)) {
      return deny(res);
    }
    return next();
  };
}
