const API_BASE_PATH = "/api"

type SuccessEnvelope<T> = {
  success: true
  data?: T
}

type ErrorEnvelope = {
  success?: false
  message?: string
  errors?: unknown
  retryAfterSeconds?: number
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  signal?: AbortSignal
}

export class ApiError extends Error {
  status: number
  fieldErrors?: Record<string, string>
  retryAfterSeconds?: number

  constructor(
    status: number,
    message: string,
    fieldErrors?: Record<string, string>,
    retryAfterSeconds?: number
  ) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.fieldErrors = fieldErrors
    this.retryAfterSeconds = retryAfterSeconds
  }
}

let unauthorizedCallback: (() => void) | null = null

export function registerOnUnauthorized(callback: () => void): () => void {
  unauthorizedCallback = callback
  return () => {
    if (unauthorizedCallback === callback) {
      unauthorizedCallback = null
    }
  }
}

function isAuthEndpoint(path: string): boolean {
  return /^\/auth\/(?:login|register(?:\/mobile\/(?:request-code|verify-code))?|logout|me)$/.test(
    path
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function getFieldErrors(errors: unknown): Record<string, string> | undefined {
  if (!isRecord(errors)) return undefined

  const fieldErrors: Record<string, string> = {}
  for (const [field, message] of Object.entries(errors)) {
    if (typeof message === "string") {
      fieldErrors[field] = message
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
}

function getRetryAfterSeconds(
  response: Response,
  errorPayload: ErrorEnvelope | null
): number | undefined {
  const fromBody = errorPayload?.retryAfterSeconds
  if (
    typeof fromBody === "number" &&
    Number.isFinite(fromBody) &&
    fromBody > 0
  ) {
    return Math.ceil(fromBody)
  }

  const fromHeader = response.headers.get("Retry-After")
  if (fromHeader) {
    const seconds = Number(fromHeader)
    if (Number.isFinite(seconds) && seconds > 0) return Math.ceil(seconds)
  }

  return undefined
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError"
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  let response: Response
  try {
    // Detect FormData — skip Content-Type header (browser sets it with boundary),
    // skip JSON.stringify (send FormData directly).
    const isFormData =
      typeof FormData !== "undefined" && options.body instanceof FormData

    response = await fetch(`${API_BASE_PATH}${path}`, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body === undefined || isFormData
          ? {}
          : { "Content-Type": "application/json" }),
      },
      body: isFormData
        ? (options.body as FormData)
        : options.body === undefined
          ? undefined
          : JSON.stringify(options.body),
      credentials: "same-origin",
      signal: options.signal,
    })
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new ApiError(0, "Cannot reach the server")
  }

  let payload: unknown
  try {
    payload = await response.json()
  } catch (error) {
    if (isAbortError(error)) throw error
    payload = undefined
  }

  if (!response.ok) {
    const errorPayload = isRecord(payload) ? (payload as ErrorEnvelope) : null
    const message =
      typeof errorPayload?.message === "string"
        ? errorPayload.message
        : "Request failed"
    if (response.status === 401 && !isAuthEndpoint(path)) {
      unauthorizedCallback?.()
    }
    throw new ApiError(
      response.status,
      message,
      getFieldErrors(errorPayload?.errors),
      getRetryAfterSeconds(response, errorPayload)
    )
  }

  if (!isRecord(payload) || payload.success !== true) {
    const errorPayload = isRecord(payload) ? (payload as ErrorEnvelope) : null
    throw new ApiError(
      response.status,
      typeof errorPayload?.message === "string"
        ? errorPayload.message
        : "Invalid server response",
      getFieldErrors(errorPayload?.errors)
    )
  }

  return (payload as SuccessEnvelope<T>).data as T
}
