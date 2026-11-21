import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { apiRequest, ApiError, registerOnUnauthorized } from "../api/client"

/* ================================================================
   Auth user shape — matches backend /api/auth/login response.
   id is now number (UUID→Int migration). role/permissions/shop
   come from backend so the UI can gate features without extra calls.
   ================================================================ */

export type AdminUser = {
  id: number
  email: string
  name: string
  role: string
  roleDisplayName: string
  permissions: Record<string, string[]>
  shopId: number | null
  shop: {
    id: number
    name: string
    slug: string
    status: string
  } | null
  createdAt?: string
  updatedAt?: string
}

export type ShopRegistrationInput = {
  shopName: string
  name: string
  email: string
  mobile: string
  address?: string
  password: string
}

type RegistrationOtpRequest = {
  expiresInSeconds: number
  developmentCode?: string
}

export type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; user: AdminUser }
  | { status: "unauthenticated" }

type AuthContextValue = {
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  requestRegistrationOtp: (
    email: string,
    mobile: string
  ) => Promise<RegistrationOtpRequest>
  verifyRegistrationOtp: (
    mobile: string,
    code: string
  ) => Promise<{ verificationToken: string }>
  registerShop: (
    input: ShopRegistrationInput & { verificationToken: string }
  ) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: AdminUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" })

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    const unregister = registerOnUnauthorized(() => {
      if (active) setState({ status: "unauthenticated" })
    })

    void apiRequest<AdminUser>("/auth/me", { signal: controller.signal })
      .then((user) => {
        if (active) setState({ status: "authenticated", user })
      })
      .catch((error: unknown) => {
        if (!active || controller.signal.aborted) return
        if (!(error instanceof ApiError)) {
          console.error("Failed to load the admin session", error)
        }
        setState({ status: "unauthenticated" })
      })

    return () => {
      active = false
      controller.abort()
      unregister()
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const user = await apiRequest<AdminUser>("/auth/login", {
      method: "POST",
      body: { email, password },
    })
    setState({ status: "authenticated", user })
  }, [])

  const requestRegistrationOtp = useCallback(
    (email: string, mobile: string) =>
      apiRequest<RegistrationOtpRequest>("/auth/register/mobile/request-code", {
        method: "POST",
        body: { email, mobile },
      }),
    []
  )

  const verifyRegistrationOtp = useCallback(
    (mobile: string, code: string) =>
      apiRequest<{ verificationToken: string }>(
        "/auth/register/mobile/verify-code",
        {
          method: "POST",
          body: { mobile, code },
        }
      ),
    []
  )

  const registerShop = useCallback(
    async (input: ShopRegistrationInput & { verificationToken: string }) => {
      const user = await apiRequest<AdminUser>("/auth/register", {
        method: "POST",
        body: input,
      })
      setState({ status: "authenticated", user })
    },
    []
  )

  const logout = useCallback(async () => {
    setState({ status: "unauthenticated" })
    await apiRequest<void>("/auth/logout", { method: "POST" })
  }, [])

  const updateUser = useCallback((user: AdminUser) => {
    setState({ status: "authenticated", user })
  }, [])

  const value = useMemo(
    () => ({
      state,
      login,
      requestRegistrationOtp,
      verifyRegistrationOtp,
      registerShop,
      logout,
      updateUser,
    }),
    [
      state,
      login,
      requestRegistrationOtp,
      verifyRegistrationOtp,
      registerShop,
      logout,
      updateUser,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
