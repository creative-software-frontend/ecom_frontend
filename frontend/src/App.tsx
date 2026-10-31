import { BrowserRouter, Route, Routes } from "react-router"
import { Suspense, lazy } from "react"
import HomePage from "./pages/HomePage"
import Ultrahot from "./pages/Products/ultrahot/Ultrahot"
import JingsengPlus from "./pages/Products/jingseng-plus/Jingseng-plus"
import LingLong from "./pages/Products/ling-long/Ling-long"
import NotFound from "./pages/NotFound"

const AdminRoot = lazy(() => import("./admin/auth/AdminRoot"))
const RequireAdmin = lazy(() => import("./admin/auth/RequireAdmin"))
const AdminLayout = lazy(() => import("./admin/layout/AdminLayout"))
const DashboardPage = lazy(() => import("./admin/pages/DashboardPage"))
const ProductsPage = lazy(() => import("./admin/pages/ProductsPage"))
const ProductCreatePage = lazy(() => import("./admin/pages/ProductCreatePage"))
const ProductEditPage = lazy(() => import("./admin/pages/ProductEditPage"))
const LoginPage = lazy(() => import("./admin/pages/LoginPage"))
const ProfilePage = lazy(() => import("./admin/pages/ProfilePage"))
const SettingsPage = lazy(() => import("./admin/pages/SettingsPage"))
const OrdersPage = lazy(() => import("./admin/pages/OrdersPage"))
const OrderDetailPage = lazy(() => import("./admin/pages/OrderDetailPage"))

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="p/ultrahot" element={<Ultrahot />} />
        <Route path="p/jingseng-plus" element={<JingsengPlus />} />
        <Route path="p/ling-long" element={<LingLong />} />
        <Route
          path="/admin"
          element={
            <Suspense
              fallback={
                <div
                  className="admin-root flex min-h-screen items-center justify-center bg-[#f1f4f6] text-sm text-gray-600"
                  role="status"
                  aria-live="polite"
                >
                  {/* TODO */}
                  Loading admin…
                </div>
              }
            >
              <AdminRoot />
            </Suspense>
          }
        >
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
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
