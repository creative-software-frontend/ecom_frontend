import { motion } from "motion/react"
import { ArrowRight, ShoppingCart, Star } from "lucide-react"
import { Button } from "../ui/button"

const sampleReviews = [
  {
    name: "গ্রাহক ১",
    location: "ঢাকা",
    review: "অর্ডার করা সহজ ছিল, প্যাকেজিংও ছিল পরিপাটি ও গোপনীয়।",
  },
  {
    name: "গ্রাহক ২",
    location: "চট্টগ্রাম",
    review: "সময়মতো পণ্য পেয়েছি এবং ক্যাশ অন ডেলিভারি সুবিধাটি ভালো লেগেছে।",
  },
]

const goToOrder = () => {
  document.getElementById("order")?.scrollIntoView({ behavior: "smooth" })
}

const ProductReviewsSection = () => (
  <section className="bg-white px-4 py-12 sm:py-16">
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <h2 className="text-3xl leading-tight font-black text-[#171717] sm:text-4xl">
          গ্রাহকের মতামত
        </h2>
        <p className="mt-3 text-sm text-gray-500 sm:text-base">
          আমাদের পণ্য ও সেবা সম্পর্কে মতামত
        </p>
        <div className="mx-auto mt-5 h-1.5 w-24 rounded-full bg-red-100">
          <div className="h-1.5 w-1/2 rounded-full bg-[#e1262f]" />
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {sampleReviews.map((review) => (
          <article
            key={review.name}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-9 items-center justify-center rounded-full bg-red-200 text-red-500">
                {review.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-[#171717]">{review.name}</h3>
                <p className="mt-1 text-xs text-gray-500">{review.location}</p>
              </div>
            </div>
            <div
              aria-label="৫ তারার নমুনা রেটিং"
              className="mt-4 flex gap-1 text-emerald-500"
            >
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} className="size-4" fill="currentColor" />
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              “{review.review}”
            </p>
          </article>
        ))}
      </div>
      <motion.div
        animate={{ scale: 1.03 }}
        transition={{
          type: "spring",
          repeat: Infinity,
          repeatType: "reverse",
          stiffness: 35,
          damping: 15,
        }}
        className="mt-8 flex justify-center"
      >
        <Button
          variant="link"
          size="lg"
          onClick={goToOrder}
          className="h-16 justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e1262f] to-[#ff4d55] px-8 text-xl font-bold text-white shadow-lg shadow-red-600/20 transition-all duration-300 hover:no-underline active:scale-95"
        >
          <ShoppingCart className="size-6" />
          এখনই অর্ডার করুন
          <ArrowRight className="size-4" />
        </Button>
      </motion.div>
    </div>
  </section>
)

export default ProductReviewsSection
