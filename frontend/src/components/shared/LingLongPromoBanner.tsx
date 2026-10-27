import { motion } from "motion/react"
import { ArrowRight, Check, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import LionImage from "@/assets/images/lion.jpeg"
const LingLongPromoBanner = () => {
  const goToOrder = () => {
    document.getElementById("order")?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section className="bg-white px-4 py-8 sm:py-12">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[28px] bg-[#1a1a1a] text-white shadow-2xl md:min-h-80 md:grid-cols-2">
        <div className="relative min-h-64 md:min-h-full">
          <img src={LionImage} alt="Lion" className="size-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-[#1a1a1a] to-transparent backdrop-blur-2xl md:bg-linear-to-r md:from-transparent md:via-[#1a1a1a]/40 md:to-[#1a1a1a]" />
        </div>

        <div className="flex flex-col justify-center bg-[#1a1a1a] p-6 sm:p-9 md:p-10">
          <h2 className="text-2xl leading-tight font-black text-gray-100 sm:text-3xl">
            দুর্বলতা ও ক্লান্তি কাটিয়ে ফিরে পান আপনার আসল আত্মবিশ্বাস
          </h2>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/6 p-4 backdrop-blur-md">
            <p className="text-sm text-gray-300">
              আত্মবিশ্বাসের সাথে খেলতে থাকুন
            </p>
            <p className="mt-1 text-xl font-black text-[#ff4d55]">
              ৪০ মিনিটেরও বেশি সময়
            </p>
          </div>

          <ul className="mt-4 grid gap-2 text-sm text-gray-300">
            {[
              "শক্তি ও স্ট্যামিনা বৃদ্ধি",
              "দীর্ঘস্থায়ী পারফরম্যান্স",
              "আত্মবিশ্বাস ফিরে পেতে সহায়ক",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-950/80">
                  <Check className="size-4 shrink-0 text-emerald-400" />
                </div>
                {item}
              </li>
            ))}
          </ul>

          <motion.div
            animate={{ scale: 1.03 }}
            whileHover={{
              scale: 1.09,
              transition: { duration: 0.2, ease: "easeOut" },
            }}
            transition={{
              type: "spring",
              repeat: Infinity,
              repeatType: "reverse",
              stiffness: 35,
              damping: 15,
            }}
            className="mt-5"
          >
            <Button
              variant="link"
              size="lg"
              onClick={goToOrder}
              className="h-16 w-full justify-center gap-2 rounded-xl bg-linear-to-r from-[#e1262f] to-[#ff4d55] text-xl font-bold text-white shadow-lg shadow-red-600/20 transition-all duration-300 hover:no-underline active:scale-95"
            >
              <ShoppingCart className="size-6" />
              এখনই অর্ডার করুন
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default LingLongPromoBanner
