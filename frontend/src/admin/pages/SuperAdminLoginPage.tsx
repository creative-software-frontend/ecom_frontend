import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Navigate } from "react-router"
import { z } from "zod"
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Layers,
  ShieldCheck,
} from "lucide-react"
import { ApiError } from "../api/client"
import { useAuth } from "../auth/AuthProvider"

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address." }),
  password: z.string().min(1, "Enter your password."),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function SuperAdminLoginPage() {
  const { state, login } = useAuth()

  const [passwordVisible, setPasswordVisible] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isRateLimited, setIsRateLimited] = useState(false)

  const {
    register,
    handleSubmit,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  })

  if (state.status === "authenticated") {
    // Super admin is already signed in
    if (state.user.role === "super_admin") {
      return <Navigate to="/admin/dashboard" replace />
    }
    // Shop user accidentally visited super admin login — send to shop
    return <Navigate to="/shop/dashboard" replace />
  }

  if (state.status === "loading") {
    return (
      <div
        className="admin-root flex min-h-screen items-center justify-center bg-(--bg-app) text-sm text-(--text-muted)"
        role="status"
      >
        Loading…
      </div>
    )
  }

  async function submitLogin(values: LoginFormValues) {
    setErrorMessage("")
    setIsRateLimited(false)
    clearErrors()
    try {
      await login(values.email, values.password)
      // Redirect handled by the authenticated block above on re-render
      // But also check role to make sure a shop user didn't sneak in
      // (role is only known after login, so redirect happens next render)
      // navigate("/admin/dashboard", { replace: true })
      // void location // suppress unused warning — 'from' state not used for super login
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        if (error.status === 429) {
          setIsRateLimited(true)
          setErrorMessage(error.message)
        } else if (error.status === 401) {
          setErrorMessage("Invalid email or password")
        } else if (error.status === 403) {
          setErrorMessage(error.message || "Access denied")
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

  const inputErrorClass =
    errorMessage && !isRateLimited
      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
      : "border-[var(--border-light)] focus:border-[var(--primary)] focus:ring-[var(--primary)]/20"

  return (
    <div className="admin-root flex min-h-screen bg-(--bg-app)">
      {/* Left: dark brand panel */}
      <div className="relative hidden w-1/2 max-w-2xl flex-col justify-between bg-[#0F172A] p-12 text-white lg:flex xl:p-16">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
              <Layers className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                Power Zenox
              </h1>
              <p className="text-xs text-slate-400">Platform Admin Console</p>
            </div>
          </div>
          <div className="mt-12">
            <span className="inline-flex items-center rounded border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-300">
              Platform Operations • Multi-tenant
            </span>
            <h2 className="mt-6 text-3xl leading-tight font-bold text-white xl:text-4xl">
              Manage all shops,
              <br />
              users, and permissions.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
              Super administrator access. Full platform visibility across every
              registered shop.
            </p>
          </div>
        </div>
        <div className="my-8 space-y-6">
          <div className="flex items-start gap-3">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-(--primary)" />
            <div>
              <p className="text-sm font-semibold text-white">
                Elevated Privileges
              </p>
              <p className="text-xs text-slate-400">
                Full access to user management, roles, shops
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-(--primary)" />
            <div>
              <p className="text-sm font-semibold text-white">
                Cross-Shop Visibility
              </p>
              <p className="text-xs text-slate-400">
                Platform-wide reports and audit logs
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-1.5 size-2 shrink-0 rounded-full bg-(--primary)" />
            <div>
              <p className="text-sm font-semibold text-white">
                Shop Kill Switch
              </p>
              <p className="text-xs text-slate-400">
                Instantly lock all users under any shop
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800 pt-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            Platform · Tier 0
          </div>
          <span>© Power Zenox</span>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex w-full flex-1 flex-col items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-105">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-lg bg-(--primary)">
              <Layers className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-(--text-primary)">
                Power Zenox
              </h1>
              <p className="text-xs text-(--text-muted)">Platform Admin</p>
            </div>
          </div>

          <div className="rounded-xl border border-(--border-light) bg-(--bg-surface) p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-(--text-primary)">
                Super admin sign in
              </h2>
              <p className="mt-2 text-sm text-(--text-muted)">
                Platform access only. Shop staff should use the shop login page.
              </p>
            </div>

            {errorMessage && !isRateLimited && (
              <div
                className="mb-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                role="alert"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
                <p>{errorMessage}</p>
              </div>
            )}
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
              <div>
                <label
                  htmlFor="sa-email"
                  className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                >
                  Email
                </label>
                <input
                  {...register("email")}
                  id="sa-email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@powerzenox.com"
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

              <div>
                <label
                  htmlFor="sa-password"
                  className="mb-1.5 block text-sm font-medium text-(--text-primary)"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register("password")}
                    id="sa-password"
                    type={passwordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    aria-invalid={Boolean(
                      errors.password || (errorMessage && !isRateLimited)
                    )}
                    disabled={isSubmitting || isRateLimited}
                    className={`block w-full rounded-md border bg-(--bg-surface) px-3 py-2 pr-10 text-sm text-(--text-primary) shadow-sm transition-all outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70 ${inputErrorClass}`}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    disabled={isSubmitting || isRateLimited}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-(--text-muted) hover:text-(--text-primary) disabled:opacity-50"
                    aria-label={
                      passwordVisible ? "Hide password" : "Show password"
                    }
                  >
                    {passwordVisible ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                {errors.password?.message && (
                  <p className="mt-1.5 text-xs text-red-600" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isRateLimited}
                className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-all focus:ring-2 focus:ring-(--primary) focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed ${
                  isRateLimited
                    ? "bg-slate-300"
                    : "bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
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

          <p className="mt-8 text-center text-xs text-(--text-muted)">
            © Power Zenox. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}

export default SuperAdminLoginPage
