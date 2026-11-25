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
const ShopRegistrationPage = lazy(
  () => import("./admin/pages/ShopRegistrationPage")
)

const SuperAdminDashboardPage = lazy(
  () => import("./admin/pages/super-admin/DashboardPage")
)
const SuperAdminUsersPage = lazy(
  () => import("./admin/pages/super-admin/UsersPage")
)
const SuperAdminRolesPage = lazy(
  () => import("./admin/pages/super-admin/RolesPage")
)
const SuperAdminShopsPage = lazy(
  () => import("./admin/pages/super-admin/ShopsPage")
)
const SuperAdminAllShopsPage = lazy(
  () => import("./admin/pages/super-admin/AllShopsPage")
)
const SuperAdminAuditPage = lazy(
  () => import("./admin/pages/super-admin/AuditPage")
)
const SuperAdminNewsPage = lazy(
  () => import("./admin/pages/super-admin/NewsPage")
)
const SuperAdminProductsPage = lazy(
  () => import("./admin/pages/super-admin/ProductsPage")
)
const SuperAdminInvoicePrintPage = lazy(
  () => import("./admin/pages/super-admin/InvoicePrintPage")
)
const SuperAdminOrdersPage = lazy(
  () => import("./admin/pages/super-admin/OrdersPage")
)
const SuperAdminOrderCreatePage = lazy(
  () => import("./admin/pages/super-admin/OrderCreatePage")
)
const SuperAdminOrderDetailPage = lazy(
  () => import("./admin/pages/super-admin/OrderDetailPage")
)

const SuperAdminProductCreatePage = lazy(
  () => import("./admin/pages/super-admin/ProductCreatePage")
)
const SuperAdminProductEditPage = lazy(
  () => import("./admin/pages/super-admin/ProductEditPage")
)

// Shop pages (existing)
const DashboardPage = lazy(() => import("./admin/pages/DashboardPage"))
const ProductsPage = lazy(() => import("./admin/pages/ProductsPage"))
const UsersPage = lazy(() => import("./admin/pages/shop-admin/ShopUsersPage"))
const ProductCreatePage = lazy(() => import("./admin/pages/ProductCreatePage"))
const ProductEditPage = lazy(() => import("./admin/pages/ProductEditPage"))
const OrdersPage = lazy(() => import("./admin/pages/OrdersPage"))
const OrderCreatePage = lazy(() => import("./admin/pages/OrderCreatePage"))
const OrderDetailPage = lazy(() => import("./admin/pages/OrderDetailPage"))
const InvoicePrintPage = lazy(() => import("./admin/pages/InvoicePrintPage"))
const SettingsPage = lazy(() => import("./admin/pages/SettingsPage"))
const ProfilePage = lazy(() => import("./admin/pages/ProfilePage"))
const RechargePage = lazy(() => import("./admin/pages/RechargePage"))
const RechargeHistoryPage = lazy(
  () => import("./admin/pages/RechargeHistoryPage")
)
const BrandsPage = lazy(() => import("./admin/pages/shop-admin/BrandsPage"))
const CategoriesPage = lazy(
  () => import("./admin/pages/shop-admin/CategoriesPage")
)
const SupportPage = lazy(() => import("./admin/pages/SupportPage"))
const NewsPage = lazy(() => import("./admin/pages/NewsPage"))

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
              // <Suspense fallback={<AdminLoading />}>
              <SuperAdminLoginPage />
              // </Suspense>
            }
          />

          {/* Super admin panel (protected) */}
          <Route path="/admin" element={<RequireSuperAdmin />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SuperAdminDashboardPage />} />
              <Route path="users" element={<SuperAdminUsersPage />} />
              <Route path="roles" element={<SuperAdminRolesPage />} />
              <Route path="shops" element={<SuperAdminShopsPage />} />
              <Route path="shops/all" element={<SuperAdminAllShopsPage />} />
              <Route path="orders" element={<SuperAdminOrdersPage />} />
              <Route
                path="orders/new"
                element={<SuperAdminOrderCreatePage />}
              />
              <Route
                path="orders/invoice"
                element={<SuperAdminInvoicePrintPage />}
              />
              <Route
                path="orders/:id"
                element={<SuperAdminOrderDetailPage />}
              />
              <Route path="products" element={<SuperAdminProductsPage />} />
              <Route
                path="products/new"
                element={<SuperAdminProductCreatePage />}
              />
              <Route
                path="products/:id/edit"
                element={<SuperAdminProductEditPage />}
              />
              <Route path="audit" element={<SuperAdminAuditPage />} />
              <Route path="news" element={<SuperAdminNewsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Shop login (public within group) */}
          <Route
            path="/login"
            element={
              // <Suspense fallback={<AdminLoading />}>
              <LoginPage />
              // </Suspense>
            }
          />
          <Route path="/shop/register" element={<ShopRegistrationPage />} />

          {/* Shop panel (protected) */}
          <Route path="/shop" element={<RequireShopUser />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="recharge" element={<RechargePage />} />
              <Route
                path="recharge/history"
                element={<RechargeHistoryPage />}
              />
              <Route
                path="settings"
                element={<Navigate to="store" replace />}
              />
              <Route path="settings/:tab" element={<SettingsPage />} />
              <Route path="brands" element={<BrandsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/new" element={<ProductCreatePage />} />
              <Route path="products/:id/edit" element={<ProductEditPage />} />

              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/new" element={<OrderCreatePage />} />
              <Route path="orders/invoice" element={<InvoicePrintPage />} />
              <Route path="orders/:id" element={<OrderDetailPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="news" element={<NewsPage />} />
              <Route path="support" element={<SupportPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
