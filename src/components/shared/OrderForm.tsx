import type { ProductTheme } from "@/types/product"
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
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react"
import { Button } from "../ui/button"

type OrderFormProps = {
  product?: unknown
  theme?: ProductTheme
  styles?: {
    sectionBg?: string
  }
  title?: string
  subtitle?: string
}

const OrderForm = (props: OrderFormProps) => {
  void props
  const accentText = props.theme?.primaryTextColor ?? "text-white"
  const trustBadges = [
    "SECURED",
    "ORIGINAL",
    "CASH ON DELIVERY",
    "24/7 SUPPORT",
  ]

  return (
    <section
      id="order"
      className={`scroll-mt-6 px-4 py-16 text-white md:py-20 ${props.styles?.sectionBg}`}
    >
      <div className="mx-auto max-w-full rounded-4xl border-4 border-white/10 bg-white/4 p-4 shadow-2xl shadow-black/20 backdrop-brightness-70 sm:max-w-2xl sm:border-8 sm:p-6 md:p-8">
        <div className="mb-8 text-center">
          <div
            className={`mx-auto mb-4 flex size-18 items-center justify-center rounded-2xl ${props.theme?.badgeBgColor} ${props.theme?.primaryTextColor} `}
          >
            <ShieldCheck size={35} />
          </div>
          <h2 className="text-3xl font-black sm:text-4xl/tight">
            {props.title}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-white/65 sm:text-base">
            নিচের ফর্মটি সঠিক তথ্য দিয়ে পূরণ করুন, আমরা দ্রুত আপনার সাথে যোগাযোগ
            করব।
          </p>
        </div>

        <div
          className={`mb-6 rounded-2xl border-2 border-white/10 bg-white/5 ${props.theme?.badgeBgColor}`}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="text-lg font-black">পণ্যের মূল্য:</span>
            <strong className={`text-2xl font-bold ${accentText}`}>
              ৳ ১,৬০০
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
                <FieldLabel className="text-white/85">আপনার নাম</FieldLabel>
                <Input
                  placeholder="সম্পূর্ণ নাম লিখুন"
                  className="mt-2 h-12 rounded-2xl border-white/15 bg-white/90 px-5 py-6 text-black placeholder:text-muted-foreground"
                />
              </Field>
              <Field>
                <FieldLabel className="text-white/85">মোবাইল নম্বর</FieldLabel>
                <Input
                  placeholder="01XXXXXXXXX"
                  className="mt-2 h-12 rounded-2xl border-white/15 bg-white/90 px-5 py-6 text-black placeholder:text-muted-foreground"
                />
              </Field>
            </FieldGroup>

            <Field>
              <FieldLabel className="text-white/85">সম্পূর্ণ ঠিকানা</FieldLabel>
              <Textarea
                placeholder="বাসা, রোড, এলাকা ও জেলার নাম লিখুন"
                rows={3}
                className="mt-2 h-26 min-h-20 resize-none border-white/15 bg-white/90 px-5 py-6 text-black placeholder:text-muted-foreground"
              />
            </Field>

            <FieldGroup className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel className="text-white/85">
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
                <span className="block text-sm font-semibold text-white/85">
                  পরিমাণ
                </span>
                <div className="mt-2 flex min-h-12 items-center justify-between rounded-lg border border-white/15 bg-black/20 px-2">
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
              <FieldLabel className="text-white/85">
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
            className={`rounded-xl border border-white/10 bg-white/5 px-4 py-2 ${props.theme?.badgeBgColor}`}
          >
            <div className="flex justify-between gap-4 py-3 text-base text-white/65">
              <span>পণ্যের মূল্য</span>
              <span>৳ ১,৬০০</span>
            </div>
            <div className="flex justify-between gap-4 border-b border-white/10 py-3 text-base text-white/65">
              <span>ডেলিভারি চার্জ</span>
              <span>৳ ৭০</span>
            </div>
            <div className="flex justify-between gap-4 py-3 text-xl font-bold text-white">
              <span>মোট মূল্য</span>
              <span className={accentText}>৳ ১,৬৭০</span>
            </div>
          </div>

          <Button
            variant="link"
            size="lg"
            className={`h-18 w-full justify-center gap-2 rounded-2xl ${props.theme?.primaryBgColor} px-6 py-5 text-xl font-bold ${props.theme?.textColor} hover:no-underline sm:py-6`}
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

        <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 text-center sm:grid-cols-4">
          {trustBadges.map((badge) => (
            <div
              key={badge}
              className="flex min-h-14 items-center justify-center gap-2 rounded-lg bg-white/4 px-2 text-[11px] font-bold text-white/60 uppercase"
            >
              <BadgeCheck className={`size-4 shrink-0 ${accentText}`} />
              {badge}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default OrderForm
