import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Navigate, useLocation, useNavigate, type Location } from "react-router"
import { z } from "zod"
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

function getLoginErrorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) {
    return "Something went wrong. Please try again."
  }
  if (error.status === 401) return "Invalid email or password"
  if (error.status === 429) return error.message
  if (error.status === 0) {
    return "Cannot reach the server. Check your connection."
  }
  return "Something went wrong. Please try again."
}

export function LoginPage() {
  const { state, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  })

  if (state.status === "authenticated") {
    return <Navigate to="/admin" replace />
  }

  if (state.status === "loading") {
    return (
      <div
        className="admin-root flex min-h-screen items-center justify-center bg-[#f1f4f6] text-sm text-gray-600"
        role="status"
        aria-live="polite"
      >
        Loading admin…
      </div>
    )
  }

  async function submitLogin(values: LoginFormValues) {
    setErrorMessage("")
    clearErrors()
    try {
      await login(values.email, values.password)
      const from = (location.state as LoginNavigationState | null)?.from
      navigate(
        from?.pathname
          ? { pathname: from.pathname, search: from.search, hash: from.hash }
          : "/admin",
        { replace: true }
      )
    } catch (error: unknown) {
      if (error instanceof ApiError && error.fieldErrors) {
        let fieldErrorWasSet = false
        if (error.fieldErrors.email) {
          setError("email", {
            type: "server",
            message: error.fieldErrors.email,
          })
          fieldErrorWasSet = true
        }
        if (error.fieldErrors.password) {
          setError("password", {
            type: "server",
            message: error.fieldErrors.password,
          })
          fieldErrorWasSet = true
        }
        if (!fieldErrorWasSet) setErrorMessage(getLoginErrorMessage(error))
      } else {
        setErrorMessage(getLoginErrorMessage(error))
      }
    }
  }

  return (
    <main className="admin-root flex min-h-screen items-center justify-center bg-[#f1f4f6] px-4 py-10">
      <section className="w-full max-w-md admin-dashboard-card bg-white p-6 sm:p-8">
        <div className="mb-7 text-center">
          <p className="mb-2 text-sm font-semibold tracking-wide text-(--admin-form-primary)">
            ArchitectUI
          </p>
          <h1 className="text-2xl font-semibold text-(--admin-sidebar-text)">
            Admin sign in
          </h1>
          <p className="mt-2 text-sm text-(--admin-sidebar-submenu-text)">
            Sign in to manage your store.
          </p>
        </div>

        <form onSubmit={handleSubmit(submitLogin)} noValidate>
          {errorMessage ? (
            <div
              className="mb-5 rounded border border-(--admin-form-error-color)/30 bg-(--admin-form-error-color)/5 px-3 py-2 text-sm admin-icon-button--danger"
              role="alert"
            >
              {errorMessage}
            </div>
          ) : null}

          <div className="admin-form-field">
            <label className="admin-form-label" htmlFor="admin-email">
              Email
            </label>
            <input
              {...register("email")}
              className="admin-form-control"
              id="admin-email"
              type="email"
              autoComplete="username"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "admin-email-error" : undefined}
              disabled={isSubmitting}
            />
            {errors.email?.message ? (
              <p
                className="admin-form-error"
                id="admin-email-error"
                role="alert"
              >
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="admin-form-field">
            <label className="admin-form-label" htmlFor="admin-password">
              Password
            </label>
            <div className="relative">
              <input
                {...register("password")}
                className="admin-form-control pr-12"
                id="admin-password"
                type={passwordVisible ? "text" : "password"}
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? "admin-password-error" : undefined
                }
                disabled={isSubmitting}
              />

              <PasswordShowHide
                passwordVisible={passwordVisible}
                setPasswordVisible={setPasswordVisible}
              />
            </div>
            {errors.password?.message ? (
              <p
                className="admin-form-error"
                id="admin-password-error"
                role="alert"
              >
                {errors.password.message}
              </p>
            ) : null}
          </div>

          <button
            className="mt-3 admin-template-button w-full admin-template-button--primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
