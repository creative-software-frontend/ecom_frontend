import { motion } from "motion/react"
import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { ChevronUp } from "lucide-react"
const BackToTop = () => {
  const [showBackToTop, setShowBackToTop] = useState(false)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    const updateBackToTopVisibility = () => {
      setShowBackToTop(window.scrollY > 500)
    }

    window.addEventListener("scroll", updateBackToTopVisibility, {
      passive: true,
    })
    updateBackToTopVisibility()
    return () => window.removeEventListener("scroll", updateBackToTopVisibility)
  }, [])

  if (!showBackToTop) return ""

  return (
    <motion.div
      whileHover={{ scale: 1.09 }}
      whileTap={{ scale: 0.95 }}
      className="fixed right-4 bottom-20 z-50"
    >
      <Button
        aria-label="উপরে ফিরে যান"
        onClick={scrollToTop}
        className="flex size-12 items-center justify-center rounded-full border border-red-700/20 bg-red-600/90 backdrop-blur-xl hover:bg-red-600"
      >
        <ChevronUp className="size-6" />
      </Button>
    </motion.div>
  )
}
export default BackToTop
