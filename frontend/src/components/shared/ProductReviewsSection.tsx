import { motion } from "motion/react"
import { ArrowRight, ShoppingCart, Star } from "lucide-react"
import { Button } from "../ui/button"
import { Carousel, CarouselContent, CarouselItem } from "../ui/carousel"
import { containerVariants, itemVariants } from "@/lib/motionVariants"

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
  {
    name: "গ্রাহক 3",
    location: "ঢাকা",
    review: "অর্ডার করা সহজ ছিল, প্যাকেজিংও ছিল পরিপাটি ও গোপনীয়।",
  },
  {
    name: "গ্রাহক 4",
    location: "চট্টগ্রাম",
    review: "সময়মতো পণ্য পেয়েছি এবং ক্যাশ অন ডেলিভারি সুবিধাটি ভালো লেগেছে।",
  },
]

const goToOrder = () => {
  document.getElementById("order")?.scrollIntoView({ behavior: "smooth" })
}

const ProductReviewsSection = () => (
  <section className="bg-white px-4 py-12 sm:py-16">
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
      className="mx-auto max-w-4xl"
    >
      <div className="text-center">
        <motion.h2
          variants={itemVariants}
          className="text-3xl leading-tight font-black text-[#171717] sm:text-4xl md:text-5xl"
        >
          গ্রাহকের মতামত
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="mt-3 text-base text-gray-500 sm:text-lg"
        >
          আমাদের পণ্য ও সেবা সম্পর্কে মতামত
        </motion.p>
        <div className="mx-auto mt-5 h-1.5 w-24 rounded-full bg-red-100">
          <div className="h-1.5 w-1/2 rounded-full bg-[#e1262f]" />
        </div>
      </div>
      {/* Carousel */}
      <Carousel
        opts={{
          loop: true,
          align: "start",
          slidesToScroll: 1,
          breakpoints: { "(min-width: 640px)": { slidesToScroll: 2 } },
        }}
        className="mx-auto mt-8 max-w-2xl"
      >
        <CarouselContent>
          {sampleReviews.map((review) => (
            <CarouselItem className="basis-full sm:basis-1/2" key={review.name}>
              <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex size-9 items-center justify-center rounded-full bg-red-200 text-red-500">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#171717]">{review.name}</h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {review.location}
                    </p>
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
            </CarouselItem>
          ))}
        </CarouselContent>
        {/* <div className="mt-5 flex justify-center gap-3">
          <CarouselPrevious className="static size-10 translate-y-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-100" />
          <CarouselNext className="static size-10 translate-y-0 border-gray-300 bg-white text-gray-700 hover:bg-gray-100" />
        </div> */}
      </Carousel>
      <motion.div
        animate={{ scale: 1.02 }}
        whileHover={{
          scale: 1.05,
          transition: { duration: 0.2, ease: "easeOut" },
        }}
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
          className="h-16 w-full justify-center gap-2 rounded-xl bg-linear-to-r from-[#e1262f] to-[#ff4d55] px-8 text-xl font-bold text-white shadow-lg shadow-red-600/20 transition-all duration-300 hover:no-underline active:scale-95 sm:w-auto"
        >
          <ShoppingCart className="size-6" />
          এখনই অর্ডার করুন
          <ArrowRight className="size-4" />
        </Button>
      </motion.div>
    </motion.div>
  </section>
)

export default ProductReviewsSection
