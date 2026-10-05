import ProductCard from "@/components/shared/ProductCard"
import productData from "../data/ProductData.json"
import type { Product } from "@/types/product"
import LogoImage from "@/assets/images/logo.jpg"

const HomePage = () => {
  return (
    <>
      <main className="">
        <header className="flex flex-col items-center pt-12">
          <img className="size-46" alt="Power Zenox Logo" src={LogoImage} />
          {/* header content */}
          <section className="py-2 text-center">
            <h1 className="text-2xl font-bold md:text-3xl">
              Welcome to Power Zenox
            </h1>
            <p className="mt-2 font-bold text-muted-foreground">
              Explore our premium products
            </p>
          </section>
        </header>
        {/* products section */}
        <section className="mt-8">
          <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
            {productData.products.map((product: Product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        </section>
      </main>
      <footer className="mt-18 border-t py-8">
        <p className="text-center text-sm font-bold text-muted-foreground">
          © Power Zenox — সকল অধিকার সংরক্ষিত
        </p>
      </footer>
    </>
  )
}
export default HomePage
