import { Flower2, Leaf, Mountain, Sprout } from "lucide-react"
import type { Product } from "@/types/product"

const ingredientIcons = [Mountain, Leaf, Sprout, Flower2]

const ProductIngredientsSection = ({ product }: { product: Product }) => {
  const ingredients = product.ingredients_section
  if (!ingredients?.items.length) return null

  return (
    <section className="bg-[#f7f8fa] px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <h2 className="text-3xl leading-tight font-black text-[#171717] sm:text-4xl md:text-5xl">
            {ingredients.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-gray-500 sm:text-base">
            {ingredients.description}
          </p>
          <div className="mx-auto mt-6 h-1.5 w-24 overflow-hidden rounded-full bg-red-100">
            <div className="h-full w-1/2 rounded-full bg-[#e1262f]" />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ingredients.items.map((ingredient, index) => {
            const Icon = ingredientIcons[index % ingredientIcons.length]

            return (
              <article
                key={ingredient.name_en}
                className="min-h-40 rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_12px_28px_rgba(20,20,20,0.06)]"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-[#171717]">
                  {ingredient.name_en} ({ingredient.name_bn})
                </h3>
                <div className="mt-3 h-0.5 w-8 bg-[#e1262f]" />
                <p className="mt-3 text-sm leading-relaxed text-gray-500">
                  {ingredient.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ProductIngredientsSection
