import ProductCard from "@/components/shared/ProductCard"
import productData from "../data/ProductData.json"
import type { Product } from "@/types/product"
import Footer from "@/components/shared/Footer"

const HomePage = () => {
  return (
    <>
      <main className="">
        <header className="flex flex-col items-center pt-12">
          <img
            className="size-46"
            alt="Power Zenox Logo"
            src="https://bqrobmupmtrsisgzveli.supabase.co/storage/v1/object/sign/media/favicon-1786030776191.jpg?token=eyJraWQiOiIxZTI2Njc0ZC0xNTYwLTQxZDEtOThmMi05MjllZmVhM2M4MTciLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJtZWRpYS9mYXZpY29uLTE3ODYwMzA3NzYxOTEuanBnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc5MTExNjMyMiwiZXhwIjoxODIyNjUyMzIyfQ.2ouMIYSwEz8NrwiDZiYK1QCQsAmOd_kxZp0B9S6-l74"
          />
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
        <section className="mt-8 mb-16">
          <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-2">
            {productData.products.map((product: Product) => (
              <ProductCard product={product} key={product.id} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
export default HomePage
