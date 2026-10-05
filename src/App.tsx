import { BrowserRouter, Route, Routes } from "react-router"
import HomePage from "./pages/HomePage"
import Ultrahot from "./pages/Products/ultrahot/Ultrahot"
import JingsengPlus from "./pages/Products/jingseng-plus/Jingseng-plus"
import LingLong from "./pages/Products/ling-long/Ling-long"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="p/ultrahot" element={<Ultrahot />} />
        <Route path="p/jingseng-plus" element={<JingsengPlus />} />
        <Route path="p/ling-long" element={<LingLong />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
