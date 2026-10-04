import { BrowserRouter, Route, Routes } from "react-router"
import HomePage from "./pages/HomePage"
import ProductDetailsPage from "./pages/ProductDetailsPage"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="p/:productId" element={<ProductDetailsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
