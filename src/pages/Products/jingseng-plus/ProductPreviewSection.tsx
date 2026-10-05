import { Button } from "@/components/ui/button"
import type { ProductPreviewSectionProps } from "@/types/product"
import { ArrowRight, BadgeCheck, Phone, ShoppingCart, Zap } from "lucide-react"

const ProductPreviewSection = ({ product }: ProductPreviewSectionProps) => {
  return (
    <section
      className={`bg-linear-to-br from-[#1a0b15] via-[#2d0a1b] to-[#1a0b15] py-18`}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
        {/* left side */}
        <div className="flex flex-col justify-center">
          <div className="p-2">
            <img src={product?.images[0]} alt="product" />
          </div>
          {/* preview product */}
          <div className="-mx-1 mt-12 flex gap-4">
            {product?.images.map((image) => (
              <button className="size-20 shrink-0 overflow-hidden rounded-2xl outline">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={image}
                    className="h-full w-full object-contain"
                    alt="product image"
                  />
                </div>
              </button>
            ))}
          </div>
          <ul className="mt-8 flex gap-6">
            {product?.specs.map((spec, i) => (
              <li>
                <p>0{i + 1}</p>
                {spec.label}
              </li>
            ))}
          </ul>
        </div>
        {/* right side */}
        <div className="">
          <div className="flex w-20 gap-2 bg-yellow-300/20 px-4 py-2 text-lg">
            <Zap fill="true" strokeWidth={0} />
            {product?.badge}
          </div>
          <h1
            className={`text-2xl leading-tight font-black text-white/90 sm:text-3xl md:text-4xl lg:text-5xl`}
          >
            {product?.tagline}
          </h1>
          <p className={`my-4 text-lg`}>{product?.short_description}</p>
          <div className={`flex gap-4`}>
            <div className="flex gap-2 px-4 py-2 text-lg">
              <BadgeCheck fill="true" strokeWidth={0} />
              ১০০% অরিজিনাল
            </div>
            <div className="flex gap-2 px-4 py-2 text-lg">
              <Zap fill="true" strokeWidth={0} />
              সারা দেশে হোম ডেলিভারি
            </div>
          </div>
          <div className="mt-8 flex gap-4">
            <div className="w-full">
              {/* price */}
              <div className="flex gap-4">
                <span className="text-3xl font-bold text-yellow-600 sm:text-4xl">
                  ৳ {product?.price.current.toLocaleString("bn-BD")}
                </span>
                <span className="text-xl text-muted-foreground line-through">
                  ৳ {product?.price.regular.toLocaleString("bn-BD")}
                </span>
              </div>
              <p className="mt-4 text-muted-foreground">
                সারা বাংলাদেশ ক্যাশ অন ডেলিভারি
              </p>
            </div>
            <div className="flex w-full flex-col gap-4">
              <Button className="w-full py-6 text-lg" size="lg">
                <ShoppingCart className="size-5" data-icon="inline-start" />
                অর্ডার করুন
                <ArrowRight data-icon="inline-end" className="size-5" />
              </Button>

              <Button variant="outline" className="w-full py-6 text-lg">
                <Phone data-icon="inline-start" className="size-5" />
                কল করুন
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
export default ProductPreviewSection
