"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Truck,
  Clock,
  MapPin,
  Wallet,
  PackageCheck,
} from "lucide-react"
import { fetchSettings, type SiteSettings } from "../lib/api"

const DEFAULT_SETTINGS: SiteSettings = {
  shipping_fast_governorates: "القاهرة, الجيزة, القليوبية, الإسكندرية",
  shipping_fast_days: "1 لـ 2 يوم عمل",
  shipping_regular_governorates:
    "الدقهلية, الشرقية, المنوفية, الغربية, كفر الشيخ, البحيرة, الفيوم, بني سويف, المنيا, أسيوط, سوهاج, قنا, الأقصر, أسوان, بورسعيد, الإسماعيلية, السويس, دمياط, شمال سيناء, جنوب سيناء, البحر الأحمر, الوادي الجديد, مطروح",
  shipping_regular_days: "3 لـ 5 أيام عمل",
  shipping_note:
    "في حالة عدم تواجدك وقت التوصيل، هيتم التواصل معكِ لإعادة جدولة التسليم في وقت مناسب من غير أي رسوم إضافية.",
}

function s(settings: SiteSettings, key: string): string {
  return settings[key] ?? DEFAULT_SETTINGS[key] ?? ""
}

function toList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function ShippingPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        if (Object.keys(data).length > 0) setSettings(data)
      })
      .finally(() => setIsLoaded(true))
  }, [])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
      </div>
    )
  }

  const governoratesFast = toList(s(settings, "shipping_fast_governorates"))
  const governoratesRegular = toList(s(settings, "shipping_regular_governorates"))

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="دهب" className="h-10 w-auto object-contain" />
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-600"
          >
            <ArrowRight size={18} />
            الرئيسية
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="mb-14 text-center">
          <p className="mb-3 text-[11px] tracking-[0.3em] text-[var(--brand)]">
            DELIVERY INFO
          </p>
          <h1 className="font-serif text-4xl md:text-5xl">
            الشحن والتوصيل
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-gray-500">
            بنوصلك في كل محافظات مصر، مع إمكانية الدفع عند الاستلام
            لراحتك وأمانك.
          </p>
        </div>

        {/* بطاقات سريعة */}
        <div className="mb-16 grid gap-5 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-7 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-tint)] text-[var(--brand)]">
              <Truck size={22} />
            </div>
            <h3 className="mb-1 font-medium">شحن لكل المحافظات</h3>
            <p className="text-sm text-gray-500">من أسوان لمطروح</p>
          </div>

          <div className="rounded-2xl bg-white p-7 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-tint)] text-[var(--brand)]">
              <Wallet size={22} />
            </div>
            <h3 className="mb-1 font-medium">الدفع عند الاستلام</h3>
            <p className="text-sm text-gray-500">آمن وسهل، من غير أي التزام مسبق</p>
          </div>

          <div className="rounded-2xl bg-white p-7 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-tint)] text-[var(--brand)]">
              <Clock size={22} />
            </div>
            <h3 className="mb-1 font-medium">توصيل سريع</h3>
            <p className="text-sm text-gray-500">
              من {s(settings, "shipping_fast_days")} حسب المحافظة
            </p>
          </div>
        </div>

        {/* مدد التوصيل */}
        <div className="mb-16 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <MapPin size={20} className="text-[var(--brand)]" />
              <h3 className="text-lg font-medium">
                القاهرة الكبرى والإسكندرية
              </h3>
            </div>
            <p className="mb-4 text-sm leading-7 text-gray-500">
              مدة التوصيل {s(settings, "shipping_fast_days")} من تاريخ تأكيد الطلب.
            </p>
            <div className="flex flex-wrap gap-2">
              {governoratesFast.map((gov) => (
                <span
                  key={gov}
                  className="rounded-full bg-[var(--brand-tint)] px-4 py-1.5 text-xs text-[var(--brand)]"
                >
                  {gov}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <MapPin size={20} className="text-[var(--brand)]" />
              <h3 className="text-lg font-medium">باقي المحافظات</h3>
            </div>
            <p className="mb-4 text-sm leading-7 text-gray-500">
              مدة التوصيل {s(settings, "shipping_regular_days")} من تاريخ تأكيد الطلب.
            </p>
            <div className="flex flex-wrap gap-2">
              {governoratesRegular.map((gov) => (
                <span
                  key={gov}
                  className="rounded-full bg-[var(--surface)] px-4 py-1.5 text-xs text-gray-600"
                >
                  {gov}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* خطوات الطلب */}
        <div className="rounded-2xl bg-[var(--ink)] p-10 text-white">
          <h3 className="mb-8 text-center text-xl font-medium">
            رحلة طلبك خطوة بخطوة
          </h3>

          <div className="grid gap-8 sm:grid-cols-4">
            {[
              ["1", "تأكيد الطلب", "بنتصل بيكِ لتأكيد بيانات الطلب"],
              ["2", "تجهيز الشحنة", "بنغلف طلبك بعناية ونجهزه للشحن"],
              ["3", "خروج للتوصيل", "شركة الشحن بتستلم الطلب وتبدأ رحلته ليكِ"],
              ["4", "الاستلام والدفع", "تستلمي طلبك وتدفعي وقت التسليم"],
            ].map(([num, title, desc]) => (
              <div key={num} className="text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--brand)] text-sm text-[var(--brand-soft)]">
                  {num}
                </div>
                <h4 className="mb-2 text-sm font-medium">{title}</h4>
                <p className="text-xs leading-6 text-white/60">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-6 text-sm text-gray-500">
          <PackageCheck size={20} className="mt-0.5 shrink-0 text-[var(--brand)]" />
          <p className="leading-7">{s(settings, "shipping_note")}</p>
        </div>
      </section>
    </main>
  )
}
