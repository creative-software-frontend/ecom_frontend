import type { Product, ProductTheme } from "@/types/product"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  BadgeCheck,
  MapPin,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react"
import { Button } from "../ui/button"

type OrderFormProps = {
  product: Product
  theme?: ProductTheme
  styles?: {
    sectionBg?: string
    [key: string]: string | undefined
  }
  title?: string
  subtitle?: string
}

const OrderForm = (props: OrderFormProps) => {
  const isLightTheme = props.theme?.appearance === "light"
  const accentBg = props.theme?.primaryBgColor ?? "bg-[#d4af37]"
  const accentText = props.theme?.primaryTextColor ?? "text-[#d4af37]"
  const fieldLabelClass = isLightTheme ? "text-[#292929]" : "text-white/85"
  const productPrice = props.product.price.current.toLocaleString("bn-BD")
  const totalPrice = (props.product.price.current + 70).toLocaleString("bn-BD")
  const trustBadges = [
    {
      icon: <ShieldCheck size={20} />,
      label: "SECURED",
    },
    {
      icon: <BadgeCheck size={20} />,
      label: "ORIGINAL",
    },
    {
      icon: <MapPin size={20} />,
      label: "CASH ON DELIVERY",
    },
    {
      icon: <Phone size={20} />,
      label: "24/7 SUPPORT",
    },
  ]

  return (
    <section
      id="order"
      className={`scroll-mt-6 px-4 py-16 md:py-20 ${isLightTheme ? "text-[#171717]" : "text-white"} ${props.styles?.sectionBg}`}
    >
      <div
        className={`mx-auto max-w-full rounded-4xl border-4 p-4 shadow-2xl sm:max-w-2xl sm:border-8 sm:p-6 md:p-8 ${isLightTheme ? "border-gray-200 bg-white shadow-gray-900/10" : `${props.styles?.formBorderColor} ${props.styles?.formBg} shadow-black/20`}`}
      >
        <div className="mb-8 text-center">
          <div
            className={`mx-auto mb-4 flex size-18 items-center justify-center rounded-2xl ${props.theme?.badgeBgColor} ${props.theme?.primaryTextColor} `}
          >
            <ShieldCheck size={35} />
          </div>
          <h2 className="text-3xl font-black sm:text-4xl/tight">
            {props.title ?? `আজই আপনার ${props.product.brand_name} অর্ডার করুন`}
          </h2>
          <p
            className={`mx-auto mt-3 max-w-xl text-lg leading-relaxed sm:text-base ${isLightTheme ? "text-gray-600" : "text-white/65"}`}
          >
            {props.subtitle ??
              "নিচের ফর্মটি সঠিক তথ্য দিয়ে পূরণ করুন, আমরা দ্রুত আপনার সাথে যোগাযোগ করব।"}
          </p>
        </div>

        <div
          className={`mb-6 rounded-2xl border-2 ${isLightTheme ? "border-gray-200 bg-gray-50" : `${props.styles?.formBorderColor} bg-white/5!`}`}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-lg font-black">পণ্যের মূল্য:</span>
            <strong className={`text-2xl font-bold ${accentText}`}>
              ৳ {productPrice}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-[#10B981]">
              <ShieldCheck size={16} /> পেমেন্ট পদ্ধতি
            </span>
            <strong className="text-sm font-semibold text-[#10B981]">
              ক্যাশ অন ডেলিভারি
            </strong>
          </div>
        </div>

        <div className="space-y-5">
          <FieldGroup className="gap-5">
            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel className={fieldLabelClass}>আপনার নাম</FieldLabel>
                <Input
                  placeholder="সম্পূর্ণ নাম লিখুন"
                  className="mt-2 h-12 rounded-2xl border-white/15 bg-white/90 px-5 py-6 text-black placeholder:text-muted-foreground"
                />
              </Field>
              <Field>
                <FieldLabel className={fieldLabelClass}>
                  মোবাইল নম্বর
                </FieldLabel>
                <Input
                  placeholder="01XXXXXXXXX"
                  className="mt-2 h-12 rounded-2xl border-white/15 bg-white/90 px-5 py-6 text-black placeholder:text-muted-foreground"
                />
              </Field>
            </FieldGroup>

            <Field>
              <FieldLabel className={fieldLabelClass}>
                সম্পূর্ণ ঠিকানা
              </FieldLabel>
              <Textarea
                placeholder="বাসা, রোড, এলাকা ও জেলার নাম লিখুন"
                rows={3}
                className="mt-2 h-26 min-h-20 resize-none border-white/15 bg-white/90 px-5 py-6 text-black placeholder:text-muted-foreground"
              />
            </Field>

            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel className={fieldLabelClass}>
                  ডেলিভারি এলাকা
                </FieldLabel>
                <Select value="inside">
                  <SelectTrigger className="mt-2 h-12 w-full border-white/15 bg-white/90 px-5 py-6 text-base text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="inside">ঢাকার ভিতরে — ৳ ৭০</SelectItem>
                      <SelectItem value="outside">
                        ঢাকার বাইরে — ৳ ১২০
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <div>
                <span
                  className={`block text-sm font-semibold ${fieldLabelClass}`}
                >
                  পরিমাণ
                </span>
                <div
                  className={`mt-2 flex min-h-12 items-center justify-between rounded-lg border px-2 ${isLightTheme ? "border-gray-200 bg-gray-50 text-[#171717]" : "border-white/15 bg-black/20"}`}
                >
                  <span className="flex size-9 items-center justify-center rounded-md text-white/75">
                    <Minus className="size-4" />
                  </span>
                  <span className="font-bold">১</span>
                  <span className="flex size-9 items-center justify-center rounded-md text-white/75">
                    <Plus className="size-4" />
                  </span>
                </div>
              </div>
            </FieldGroup>

            <Field>
              <FieldLabel className={fieldLabelClass}>
                অতিরিক্ত তথ্য
                <span className="font-normal text-white/40">(ঐচ্ছিক)</span>
              </FieldLabel>
              <Textarea
                placeholder="কোনো নির্দেশনা থাকলে লিখুন"
                rows={2}
                className="mt-2 h-26 min-h-20 resize-none border-white/15 bg-white/90 px-5 py-6 text-black placeholder:text-muted-foreground"
              />
            </Field>
          </FieldGroup>

          <div
            className={`rounded-xl border px-4 py-2 ${isLightTheme ? "border-gray-200 bg-gray-50" : "border-white/10 bg-white/5"} ${props.theme?.badgeBgColor}`}
          >
            <div
              className={`flex justify-between gap-4 py-3 text-base ${isLightTheme ? "text-gray-600" : "text-white/65"}`}
            >
              <span>পণ্যের মূল্য</span>
              <span>৳ {productPrice}</span>
            </div>
            <div
              className={`flex justify-between gap-4 border-b py-3 text-base ${isLightTheme ? "border-gray-200 text-gray-600" : "border-white/10 text-white/65"}`}
            >
              <span>ডেলিভারি চার্জ</span>
              <span>৳ ৭০</span>
            </div>
            <div
              className={`flex justify-between gap-4 py-3 text-xl font-bold ${isLightTheme ? "text-[#171717]" : "text-white"}`}
            >
              <span>মোট মূল্য</span>
              <span className={accentText}>৳ {totalPrice}</span>
            </div>
          </div>

          <Button
            variant="link"
            size="lg"
            className={`h-18 w-full justify-center gap-2 rounded-2xl ${accentBg} px-6 py-5 text-xl font-bold ${isLightTheme ? "text-white" : (props.theme?.textColor ?? "text-slate-950")} hover:no-underline sm:py-6`}
          >
            <ShoppingCart className="size-8" />
            অর্ডার নিশ্চিত করুন
          </Button>
          {/* <div
            className={`flex min-h-14 w-full items-center justify-center gap-2 rounded-xl px-6 text-base font-black text-slate-950 ${accentBg}`}
          ></div> */}
          <div className="mx-auto flex w-fit items-center gap-2 text-base text-[#10B981]">
            <ShieldCheck size={16} /> পণ্য হাতে পেয়ে টাকা পরিশোধ করুন
          </div>
          {/* <p className="flex items-center justify-center gap-2 text-center text-sm text-white/65">
            <Check className={`size-4 ${accentText}`} />
          </p> */}
        </div>

        <div
          className={`mt-8 grid grid-cols-2 gap-3 border-t pt-6 text-center sm:grid-cols-4 ${isLightTheme ? "border-gray-200" : "border-white/10"}`}
        >
          {trustBadges.map(({ label, icon }) => (
            <div
              key={label}
              className={`flex min-h-14 flex-col items-center justify-center gap-2 rounded-lg px-2 text-[11px] font-bold uppercase ${isLightTheme ? "text-gray-500" : "text-white/60"}`}
            >
              {icon}
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default OrderForm
