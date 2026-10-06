import { BadgeCheck, Banknote, Truck } from "lucide-react"

const reasons = [
  {
    icon: BadgeCheck,
    title: "১০০% অরিজিনাল",
    description: "অরিজিনাল পণ্য পাওয়ার নিশ্চয়তা।",
  },
  {
    icon: Banknote,
    title: "ক্যাশ অন ডেলিভারি",
    description: "পণ্য হাতে পেয়ে মূল্য পরিশোধ করুন।",
  },
  {
    icon: Truck,
    title: "দ্রুত ডেলিভারি",
    description: "সারা দেশে হোম ডেলিভারি সুবিধা।",
  },
]

const WhyChooseUsSection = () => (
  <section className="bg-[#f7f8fa] px-4 py-12 sm:py-16">
    <div className="mx-auto max-w-4xl">
      <div className="text-center">
        <h2 className="text-3xl leading-tight font-black text-[#171717] sm:text-4xl">
          আমাদের কেন বেছে নেবেন?
        </h2>
        <div className="mx-auto mt-5 h-1.5 w-24 rounded-full bg-red-100">
          <div className="h-1.5 w-1/2 rounded-full bg-[#e1262f]" />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {reasons.map(({ icon: Icon, title, description }, index) => (
          <article
            key={title}
            className="flex min-h-24 items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-sm font-black text-[#e1262f]">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="flex items-center gap-2 font-bold text-[#171717]">
                <Icon className="size-4 text-emerald-500" />
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  </section>
)

export default WhyChooseUsSection
