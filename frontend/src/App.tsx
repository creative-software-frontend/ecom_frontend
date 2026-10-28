import { BrowserRouter, Route, Routes } from "react-router"
import { Suspense, lazy } from "react"
import HomePage from "./pages/HomePage"
import Ultrahot from "./pages/Products/ultrahot/Ultrahot"
import JingsengPlus from "./pages/Products/jingseng-plus/Jingseng-plus"
import LingLong from "./pages/Products/ling-long/Ling-long"
import NotFound from "./pages/NotFound"

const AdminLayout = lazy(() => import("./admin/layout/AdminLayout"))
const DashboardPage = lazy(() => import("./admin/pages/DashboardPage"))
const ProductsPage = lazy(() => import("./admin/pages/ProductsPage"))
const ProductCreatePage = lazy(() => import("./admin/pages/ProductCreatePage"))
const ProductEditPage = lazy(() => import("./admin/pages/ProductEditPage"))

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
            <Suspense fallback={null}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={null}>
                <DashboardPage />
              </Suspense>
            }
          />
          <Route
            path="products"
            element={
              <Suspense fallback={null}>
                <ProductsPage />
              </Suspense>
            }
          />
          <Route
            path="products/new"
            element={
              <Suspense fallback={null}>
                <ProductCreatePage />
              </Suspense>
            }
          />
          <Route
            path="products/:id/edit"
            element={
              <Suspense fallback={null}>
                <ProductEditPage />
              </Suspense>
            }
          />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
