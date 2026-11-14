import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Navigate, useLocation, useNavigate, type Location } from "react-router"
import { z } from "zod"
import { Layers, Loader2, AlertCircle, AlertTriangle } from "lucide-react"
import { ApiError } from "../api/client"
import { useAuth } from "../auth/AuthProvider"
import { PasswordShowHide } from "../components/PasswordShowHide"

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address." }),
  password: z.string().min(1, "Enter your password."),
})

type LoginFormValues = z.infer<typeof loginSchema>

type LoginNavigationState = {
  from?: Pick<Location, "pathname" | "search" | "hash">
}

export function LoginPage() {
  const { state, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [passwordVisible, setPasswordVisible] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isRateLimited, setIsRateLimited] = useState(false)

  const {
    register,
    handleSubmit,
    // setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    // TODO:remove for production
    defaultValues: {
      email: "test-admin@powerzenox.com",
      password: "TestPassword123",
    },
    mode: "onSubmit",
  })
  if (state.status === "authenticated") {
    if (state.user.role === "super_admin") {
      return <Navigate to="/admin/dashboard" replace />
    }
    return <Navigate to="/shop/dashboard" replace />
  }

  if (state.status === "loading") {
    return (
      <div
        className="admin-root flex min-h-screen items-center justify-center bg-(--bg-app) text-sm text-(--text-muted)"
        role="status"
      >
        Loading admin…
      </div>
    )
  }

  async function submitLogin(values: LoginFormValues) {
    setErrorMessage("")
    setIsRateLimited(false)
    clearErrors()

    try {
      await login(values.email, values.password)
      const from = (location.state as LoginNavigationState | null)?.from
      // Only honor `from` if it points into /shop/*. A stale /admin/*
      // path from a previous session would redirect into the super admin
      // area — and then bounce to /shop/dashboard on a second redirect.
      const safeFrom = from?.pathname?.startsWith("/shop/") ? from : null
      navigate(
        safeFrom
          ? {
              pathname: safeFrom.pathname,
              search: safeFrom.search,
              hash: safeFrom.hash,
            }
          : "/shop/dashboard",
        { replace: true }
      )
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.status === 429) {
          setIsRateLimited(true)
          setErrorMessage(error.message)
        } else if (error.status === 401) {
          setErrorMessage("Invalid email or password")
        } else if (error.status === 0) {
          setErrorMessage("Cannot reach the server. Check your connection.")
        } else {
          setErrorMessage(error.message || "Something went wrong.")
        }
      } else {
        setErrorMessage("Something went wrong. Please try again.")
      }
    }
  }

  // Helper for input styling based on error state
  const inputErrorClass =
    errorMessage && !isRateLimited
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
      : "border-[var(--border-light)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"

  return (
    <div className="admin-root flex min-h-screen bg-(--bg-app)">
      {/* Left Panel - Dark Brand Section */}
      <div className="relative hidden w-1/2 max-w-2xl flex-col justify-between bg-[#0F172A] p-12 text-white lg:flex xl:p-16">
        {/* Top: Logo & Badge */}
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
              <Layers className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Power Zenox
              </h1>
              <p className="text-xs text-slate-400">Admin Console</p>
            </div>
          </div>

          <div className="mt-12">
            <span className="inline-flex items-center rounded border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-300">
              Internal Admin • BD Store Operations
            </span>
            <h2 className="mt-6 text-3xl leading-tight font-bold text-white xl:text-4xl">
              Manage orders and
              <br />
              products in one place.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              Authorized personnel access only. Single sign-on and
              administrative controls for central inventory, retail store
              dispatch, and customer order processing.
            </p>
          </div>
        </div>

        {/* Middle: Features List */}
        <div className="my-8 space-y-6">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
            <div>
              <p className="text-sm font-semibold text-white">Session Policy</p>
              <p className="text-xs text-slate-400">
                8h rolling timeout • Inactivity lock enabled
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
            <div>
              <p className="text-sm font-semibold text-white">
                Rate Limiting Protected
              </p>
              <p className="text-xs text-slate-400">
                Strict 5-attempt threshold with 15m cooldown
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
            <div>
              <p className="text-sm font-semibold text-white">
                Internal Domain Only
              </p>
              <p className="text-xs text-slate-400">
                Restricted to authorized @powerzenox.com profiles
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-6 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span>v2.8.4</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex w-full flex-1 flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-105">
          {/* Mobile Header (Visible only on small screens) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
              <Layers className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-(--text-primary)">
                Power Zenox
              </h1>
              <p className="text-xs text-(--text-muted)">Admin panel</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="rounded-xl border border-(--border-light) bg-(--bg-surface) p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-(--text-primary)">
                Sign in
              </h2>
              <p className="mt-2 text-sm text-(--text-muted)">
                Use your admin account to manage orders and products.
              </p>
            </div>

            {/* Error Alert (Invalid Credentials) */}
            {errorMessage && !isRateLimited && (
              <div
                className="mb-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Rate Limit Alert */}
            {isRateLimited && (
              <div
                className="mb-5 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                role="alert"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p>{errorMessage}</p>
              </div>
            )}

            <form
              onSubmit={handleSubmit(submitLogin)}
              noValidate
              className="space-y-5"
            >
              {/* Email Field */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                >
                  Email
                </label>
                <input
                  {...register("email")}
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  placeholder="abdur.razzaq@powerzenox.com"
                  aria-invalid={Boolean(
                    errors.email || (errorMessage && !isRateLimited)
                  )}
                  disabled={isSubmitting || isRateLimited}
                  className={`block w-full rounded-md border bg-(--bg-surface) px-3 py-2 text-sm text-(--text-primary) shadow-sm transition-all outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70 ${inputErrorClass}`}
                />
                {errors.email?.message && (
                  <p className="mt-1.5 text-xs text-red-600" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    id="admin-password"
                    type={passwordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={Boolean(
                      errors.password || (errorMessage && !isRateLimited)
                    )}
                    disabled={isSubmitting || isRateLimited}
                    className={`block w-full rounded-md border bg-(--bg-surface) px-3 py-2 pr-10 text-sm text-(--text-primary) shadow-sm transition-all outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70 ${inputErrorClass}`}
                  />
                  <PasswordShowHide
                    setPasswordVisible={setPasswordVisible}
                    passwordVisible={passwordVisible}
                  />
                  {/* <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    disabled={isSubmitting || isRateLimited}
                    className="absolute inset-y-0 right-0 mr-3 flex items-center text-(--text-muted) hover:text-(--text-primary) disabled:opacity-50"
                    aria-label={
                      passwordVisible ? "Hide password" : "Show password"
                    }
                  >
                    {passwordVisible ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button> */}
                </div>
                {errors.password?.message && (
                  <p className="mt-1.5 text-xs text-red-600" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isRateLimited}
                className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-all focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed ${
                  isRateLimited
                    ? "bg-slate-300"
                    : "bg-primary hover:bg-(--primary-hover)"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>
          </div>

          {/* Footer Text */}
          <p className="mt-8 text-center text-xs text-(--text-muted)">
            © Power Zenox. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
