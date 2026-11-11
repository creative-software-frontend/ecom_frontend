import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { Suspense, lazy } from "react"
import HomePage from "./pages/HomePage"
import Ultrahot from "./pages/Products/ultrahot/Ultrahot"
import JingsengPlus from "./pages/Products/jingseng-plus/Jingseng-plus"
import LingLong from "./pages/Products/ling-long/Ling-long"
import NotFound from "./pages/NotFound"

// Admin shell (shared by super admin + shop)
const AdminRoot = lazy(() => import("./admin/auth/AdminRoot"))
const RequireSuperAdmin = lazy(() => import("./admin/auth/RequireSuperAdmin"))
const RequireShopUser = lazy(() => import("./admin/auth/RequireShopUser"))
const AdminLayout = lazy(() => import("./admin/layout/AdminLayout"))

// Login pages
const SuperAdminLoginPage = lazy(
  () => import("./admin/pages/SuperAdminLoginPage")
)
const LoginPage = lazy(() => import("./admin/pages/LoginPage"))

// Super admin pages (placeholders for A5)
const SuperAdminDashboardPage = lazy(
  () => import("./admin/pages/super-admin/PlaceholderPage")
)
const SuperAdminUsersPage = lazy(
  () => import("./admin/pages/super-admin/PlaceholderPage")
)
const SuperAdminRolesPage = lazy(
  () => import("./admin/pages/super-admin/PlaceholderPage")
)
const SuperAdminShopsPage = lazy(
  () => import("./admin/pages/super-admin/PlaceholderPage")
)
const SuperAdminAuditPage = lazy(
  () => import("./admin/pages/super-admin/PlaceholderPage")
)

// Shop pages (existing)
const DashboardPage = lazy(() => import("./admin/pages/DashboardPage"))
const ProductsPage = lazy(() => import("./admin/pages/ProductsPage"))
const ProductCreatePage = lazy(() => import("./admin/pages/ProductCreatePage"))
const ProductEditPage = lazy(() => import("./admin/pages/ProductEditPage"))
const OrdersPage = lazy(() => import("./admin/pages/OrdersPage"))
const OrderDetailPage = lazy(() => import("./admin/pages/OrderDetailPage"))
const SettingsPage = lazy(() => import("./admin/pages/SettingsPage"))
const ProfilePage = lazy(() => import("./admin/pages/ProfilePage"))

function AdminLoading() {
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

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public site */}
        <Route path="/" element={<HomePage />} />
        <Route path="p/ultrahot" element={<Ultrahot />} />
        <Route path="p/jingseng-plus" element={<JingsengPlus />} />
        <Route path="p/ling-long" element={<LingLong />} />

        {/* Admin group — all admin-ish routes share AuthProvider */}
        <Route
          element={
            <Suspense fallback={<AdminLoading />}>
              <AdminRoot />
            </Suspense>
          }
        >
          {/* Super admin login (public within group) */}
          <Route
            path="/admin/login"
            element={
              <Suspense fallback={<AdminLoading />}>
                <SuperAdminLoginPage />
              </Suspense>
            }
          />

          {/* Super admin panel (protected) */}
          <Route path="/admin" element={<RequireSuperAdmin />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route
                path="dashboard"
                element={<SuperAdminDashboardPage title="Platform Dashboard" />}
              />
              <Route
                path="users"
                element={<SuperAdminUsersPage title="Admin Users" />}
              />
              <Route
                path="roles"
                element={<SuperAdminRolesPage title="Roles & Permissions" />}
              />
              <Route
                path="shops"
                element={<SuperAdminShopsPage title="Shops" />}
              />
              <Route
                path="audit"
                element={<SuperAdminAuditPage title="Audit Log" />}
              />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Shop login (public within group) */}
          <Route
            path="/login"
            element={
              <Suspense fallback={<AdminLoading />}>
                <LoginPage />
              </Suspense>
            }
          />

          {/* Shop panel (protected) */}
          <Route path="/shop" element={<RequireShopUser />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route
                path="settings"
                element={<Navigate to="store" replace />}
              />
              <Route path="settings/:tab" element={<SettingsPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/new" element={<ProductCreatePage />} />
              <Route path="products/:id/edit" element={<ProductEditPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
