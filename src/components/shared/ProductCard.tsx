import { ChevronRight } from "lucide-react"
import { motion } from "motion/react"
import { Link } from "react-router"
import { Card, CardTitle } from "../ui/card"
import type { ProductCardProps } from "@/types/product"

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03, transition: { duration: 0.25 } }}
      key={product.id}
    >
      <Card className="mx-auto w-full cursor-pointer overflow-auto pt-0 hover:text-red-600">
        <img src={product.images[0]} alt="Event cover" className="m-4" />
        <CardTitle className="text-center text-xl font-bold">
          {product.name}
        </CardTitle>
        <Link
          className="mx-auto -mt-3 mb-2 flex w-fit items-center justify-center gap-1 text-lg font-bold text-red-600"
          to={"/"}
        >
          <p className="hover:border-b-2 hover:border-b-red-600">বিস্তারিত</p>
          <ChevronRight />
        </Link>
      </Card>
    </motion.div>
  )
}
export default ProductCard
