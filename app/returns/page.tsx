"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  MessageCircle,
} from "lucide-react"
import { fetchSettings, type SiteSettings } from "../lib/api"
import SiteHeader from "../components/SiteHeader"

const DEFAULT_SETTINGS: SiteSettings = {
  returns_period_days: "14",
  returns_conditions:
    "المنتج لسه بحالته الأصلية ومتلبسش أو مستخدم.\nالتيكيت والملصقات الأصلية لسه موجودة على القطعة.\nمعاكِ فاتورة الشراء أو رقم الطلب.\nالطلب لسه في مدة الاسترجاع.\nالمنتج معبأ في تغليفه الأصلي قدر الإمكان.",
  returns_exceptions:
    "المنتجات المخفضة في عروض التصفية النهائية.\nالإكسسوارات بعد فك التغليف الأصلي.\nالمنتجات اللي فيها علامات استخدام واضحة.\nالطلبات اللي اتعدت مدة الاسترجاع.",
}

function s(settings: SiteSettings, key: string): string {
  return settings[key] ?? DEFAULT_SETTINGS[key] ?? ""
}

function toLines(value: string): string[] {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function ReturnsPage() {
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

  const conditions = toLines(s(settings, "returns_conditions"))
  const exceptions = toLines(s(settings, "returns_exceptions"))
  const periodDays = s(settings, "returns_period_days")

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-5 py-16">
        <div className="mb-14 text-center">
          <p className="mb-3 text-[11px] tracking-[0.3em] text-[var(--brand)]">
            RETURNS &amp; EXCHANGE
          </p>
          <h1 className="font-serif text-4xl md:text-5xl">
            الاستبدال والاسترجاع
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-gray-500">
            رضاكِ عن مشترياتك هو أهم حاجة عندنا، وده سياستنا في الاستبدال
            والاسترجاع عشان تسوقي بكل راحة وأمان.
          </p>
        </div>

        <div className="mb-12 flex flex-col items-center gap-4 rounded-2xl bg-[var(--ink)] p-10 text-center text-white sm:flex-row sm:text-right">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--brand)]/20 text-[var(--brand-soft)]">
            <RotateCcw size={26} />
          </div>
          <div>
            <h3 className="mb-1 text-lg font-medium">
              استبدال أو استرجاع خلال {periodDays} يوم
            </h3>
            <p className="text-sm leading-7 text-white/60">
              من تاريخ استلام طلبك، طالما المنتج بحالته الأصلية.
            </p>
          </div>
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white p-7 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-green-600" />
              <h3 className="text-base font-medium">شروط الاستبدال/الاسترجاع</h3>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-gray-500">
              {conditions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white p-7 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <XCircle size={20} className="text-red-500" />
              <h3 className="text-base font-medium">حالات مستثناة</h3>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-gray-500">
              {exceptions.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* خطوات الاسترجاع */}
        <div className="mb-12 rounded-2xl bg-white p-8 shadow-sm sm:p-10">
          <h3 className="mb-8 text-center text-lg font-medium">
            إزاي تعملي طلب استبدال أو استرجاع؟
          </h3>

          <div className="grid gap-8 sm:grid-cols-3">
            {[
              [
                "1",
                "تواصلي معنا",
                "ابعتيلنا رقم طلبك وسبب الاستبدال أو الاسترجاع عن طريق صفحة تواصل معنا.",
              ],
              [
                "2",
                "استلام القطعة",
                "هنرتب معاكِ ميعاد لاستلام القطعة من عندك مجانًا.",
              ],
              [
                "3",
                "الاستبدال أو استرداد المبلغ",
                "بعد فحص القطعة، هنبعتلك البديل أو نرجعلك المبلغ خلال 3-5 أيام عمل.",
              ],
            ].map(([num, title, desc]) => (
              <div key={num} className="text-center">
                <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--brand)] text-sm text-[var(--brand)]">
                  {num}
                </div>
                <h4 className="mb-2 text-sm font-medium">{title}</h4>
                <p className="text-xs leading-6 text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-black/5 bg-white p-7 sm:flex-row">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <MessageCircle size={20} className="text-[var(--brand)]" />
            <span>لسه عندك استفسار عن طلب استبدال أو استرجاع؟</span>
          </div>

          <Link
            href="/contact"
            className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm text-white transition hover:bg-[var(--brand)]"
          >
            تواصل معنا
          </Link>
        </div>
      </section>
    </main>
  )
}
