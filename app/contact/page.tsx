"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
} from "lucide-react"
import { fetchSettings, submitContactMessage, type SiteSettings } from "../lib/api"
import SiteHeader from "../components/SiteHeader"
import StoreFooter from "../components/StoreFooter"

const DEFAULT_SETTINGS: SiteSettings = {
  contact_phone: "01000000000",
  contact_email: "support@dahab-store.com",
  contact_address: "القاهرة، جمهورية مصر العربية",
  contact_hours: "السبت – الخميس: 10 ص – 10 م",
  contact_instagram_url: "#",
  contact_facebook_url: "#",
}

function s(settings: SiteSettings, key: string): string {
  return settings[key] ?? DEFAULT_SETTINGS[key] ?? ""
}

export default function ContactPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchSettings()
      .then((data) => {
        if (Object.keys(data).length > 0) setSettings(data)
      })
      .finally(() => setIsLoaded(true))
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !phone || !message) return

    setSending(true)
    setError("")

    submitContactMessage({ name, phone, message })
      .then(() => {
        setSent(true)
        setName("")
        setPhone("")
        setMessage("")
      })
      .catch(() => {
        setError("تعذر إرسال الرسالة — تأكدي من اتصال الإنترنت وحاولي تاني")
      })
      .finally(() => setSending(false))
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
      </div>
    )
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="mb-14 text-center">
          <p className="mb-3 text-[11px] tracking-[0.3em] text-[var(--brand)]">
            GET IN TOUCH
          </p>
          <h1 className="font-serif text-4xl md:text-5xl">تواصل معنا</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-8 text-gray-500">
            عندك سؤال عن طلب أو منتج أو حابة تستفسري عن حاجة؟ إحنا هنا،
            ابعتيلنا رسالة وهنرد عليكِ في أسرع وقت.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-5">
          {/* بيانات التواصل */}
          <div className="space-y-6 lg:col-span-2">
            <div className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-tint)] text-[var(--brand)]">
                <Phone size={19} />
              </div>
              <div>
                <h3 className="mb-1 text-sm font-medium">اتصلي بينا</h3>
                <p dir="ltr" className="text-sm text-gray-500">
                  {s(settings, "contact_phone")}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  يوميًا من 10 ص لـ 10 م
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-tint)] text-[var(--brand)]">
                <Mail size={19} />
              </div>
              <div>
                <h3 className="mb-1 text-sm font-medium">راسلينا</h3>
                <p dir="ltr" className="text-sm text-gray-500">
                  {s(settings, "contact_email")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-tint)] text-[var(--brand)]">
                <MapPin size={19} />
              </div>
              <div>
                <h3 className="mb-1 text-sm font-medium">موقعنا</h3>
                <p className="text-sm text-gray-500">
                  {s(settings, "contact_address")}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-tint)] text-[var(--brand)]">
                <Clock size={19} />
              </div>
              <div>
                <h3 className="mb-1 text-sm font-medium">مواعيد خدمة العملاء</h3>
                <p className="text-sm text-gray-500">
                  {s(settings, "contact_hours")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <a
                href={s(settings, "contact_instagram_url")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ink)] text-xs font-medium text-white transition hover:bg-[var(--brand)]"
              >
                IG
              </a>
              <a
                href={s(settings, "contact_facebook_url")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--ink)] text-xs font-medium text-white transition hover:bg-[var(--brand)]"
              >
                f
              </a>
            </div>
          </div>

          {/* الفورم */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl bg-white p-7 shadow-sm sm:p-10">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <Send size={26} />
                  </div>
                  <h3 className="mb-2 text-xl font-medium">
                    تم إرسال رسالتك بنجاح
                  </h3>
                  <p className="max-w-xs text-sm text-gray-500">
                    شكرًا لتواصلك معنا، هيتم الرد عليكِ في أقرب وقت ممكن.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-6 text-sm text-[var(--brand)] hover:underline"
                  >
                    إرسال رسالة تانية
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      الاسم
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="اكتبي اسمك"
                      className="w-full rounded-xl border border-black/10 bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      رقم الموبايل
                    </label>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      dir="ltr"
                      placeholder="01xxxxxxxxx"
                      className="w-full rounded-xl border border-black/10 bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      رسالتك
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={5}
                      placeholder="اكتبي استفسارك هنا..."
                      className="w-full resize-none rounded-xl border border-black/10 bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--brand)]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--ink)] py-4 text-sm text-white transition hover:bg-[var(--brand)] disabled:opacity-60"
                  >
                    {sending ? "جارِ الإرسال..." : "إرسال الرسالة"}
                    <Send size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
      <StoreFooter />

    </main>
  )
}
