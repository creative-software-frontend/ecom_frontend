import type { Response } from "express";
import type { ZodError } from "zod";

type FieldErrorOptions = {
  firstPathSegmentOnly?: boolean;
  /** Most endpoints use `"form"` when an issue has no path. */
  emptyPathKey?: string;
};

/**
 * Zod issues → the `{ field: message }` map the API returns for 422s.
 *
 * Most controllers want the full dotted path (`banners.0.text`). The auth
 * endpoints only use the first path segment (`mobile`), so both behaviours
 * are available to preserve the existing response shapes exactly.
 */
export function fieldErrorsFromZod(
  error: ZodError,
  options: FieldErrorOptions = {}
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    if (options.firstPathSegmentOnly) {
      const field = issue.path[0];
      if (typeof field === "string" && !(field in errors)) {
        errors[field] = issue.message;
      }
      continue;
    }

    const key = issue.path.join(".") || (options.emptyPathKey ?? "form");
    if (!(key in errors)) errors[key] = issue.message;
  }

  return errors;
}

/** Standard 422 response for a failed `safeParse`. */
export function sendValidationError(
  res: Response,
  error: ZodError,
  options: FieldErrorOptions = {}
) {
  return res.status(422).json({
    success: false,
    message: "Validation failed",
    errors: fieldErrorsFromZod(error, options),
  });
}
