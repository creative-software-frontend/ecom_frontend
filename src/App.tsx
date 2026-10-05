import { BrowserRouter, Route, Routes } from "react-router"
import HomePage from "./pages/HomePage"
import Ultrahot from "./pages/Products/ultrahot/Ultrahot"
import JingsengPlus from "./pages/Products/jingseng-plus/Jingseng-plus"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="p/ultrahot" element={<Ultrahot />} />
        <Route path="p/jingseng-plus" element={<JingsengPlus />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
