"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  FileText,
} from "lucide-react"
import { useCart } from "../context/CartContext"
import { createOrder } from "../lib/api"
import SiteLogo from "../components/SiteLogo"

const governorates = [
  "القاهرة",
  "الجيزة",
  "القليوبية",
  "الإسكندرية",
  "المنوفية",
  "الغربية",
  "الدقهلية",
  "الشرقية",
  "البحيرة",
  "كفر الشيخ",
  "دمياط",
  "بورسعيد",
  "الإسماعيلية",
  "السويس",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "مطروح",
  "البحر الأحمر",
  "الوادي الجديد",
  "شمال سيناء",
  "جنوب سيناء",
]

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart()

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [governorate, setGovernorate] = useState("")
  const [area, setArea] = useState("")
  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [orderId, setOrderId] = useState<number | null>(null)
  const [trackingCode, setTrackingCode] = useState("")
  const [copied, setCopied] = useState(false)
  const [orderTotal, setOrderTotal] = useState(0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!name || !phone || !governorate || !area || !address) {
      alert("من فضلك أكمل جميع البيانات المطلوبة")
      return
    }

    setSubmitting(true)

    try {
      const { orderId, trackingCode } = await createOrder({
        customer_name: name,
        phone,
        governorate,
        area,
        address,
        notes,
        total: cartTotal,
        items: cart.map((item) => ({
          product_id: item.id,
          product_name: item.name,
          price: item.price,
          quantity: item.quantity,
          selected_color: item.selectedColor,
          selected_size: item.selectedSize,
        })),
      })

      setOrderId(orderId)
      setTrackingCode(trackingCode)
      setOrderTotal(cartTotal)
      setSubmitted(true)
      clearCart()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "تعذر إتمام الطلب، حاول مرة أخرى"
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (cart.length === 0 && !submitted) {
    return (
      <main dir="rtl" className="min-h-screen bg-[var(--bg)]">
        <header className="border-b border-black/10 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
            <Link href="/" className="flex items-center">
            <SiteLogo className="h-10 w-auto object-contain" />
          </Link>

            <Link
              href="/products"
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              <ArrowRight size={18} />
              متابعة التسوق
            </Link>
          </div>
        </header>

        <section className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-5">
          <div className="w-full rounded-3xl bg-white p-8 text-center shadow-sm">
            <ShoppingBag
              size={42}
              strokeWidth={1.3}
              className="mx-auto mb-5"
            />

            <h1 className="text-2xl font-semibold">
              السلة فارغة
            </h1>

            <p className="mt-3 text-sm leading-7 text-gray-500">
              أضف منتجات إلى السلة أولاً قبل إتمام الطلب.
            </p>

            <Link
              href="/products"
              className="mt-7 inline-flex items-center gap-3 rounded-full bg-black px-7 py-3.5 text-sm text-white"
            >
              تصفح المنتجات
              <ArrowLeft size={18} />
            </Link>
          </div>
        </section>
      </main>
    )
  }

  if (submitted) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-5"
      >
        <div className="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm sm:p-12">

          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2
              size={42}
              className="text-green-600"
              strokeWidth={1.5}
            />
          </div>

          <p className="text-sm text-[var(--brand-dark)]">
            DAHAB STORE
          </p>

          <h1 className="mt-2 font-serif text-4xl">
            تم استلام طلبك
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-8 text-gray-500">
            شكرًا لطلبك من دهب. تم تسجيل بيانات الطلب بنجاح،
            وسنتواصل معك على رقم الهاتف لتأكيد الطلب والتوصيل.
          </p>

          <div className="mt-7 rounded-2xl bg-[var(--bg)] p-5">
            {trackingCode && (
              <div className="mb-4">
                <p className="mb-2 text-sm text-gray-500">
                  كود التتبع — احفظيه واستخدميه لمتابعة طلبك:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(trackingCode)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="w-full rounded-xl border border-dashed border-black/20 bg-white px-4 py-3 font-mono text-xl font-semibold tracking-[0.3em]"
                >
                  {trackingCode}
                </button>
                <p className="mt-1.5 text-xs text-gray-400">
                  {copied ? "تم النسخ ✅" : "اضغطي على الكود للنسخ"}
                </p>
              </div>
            )}

            {orderId && (
              <p className="mb-3 text-sm text-gray-500">
                رقم الطلب: <span className="font-semibold text-black">#DAH-{orderId}</span>
              </p>
            )}

            <p className="text-sm text-gray-500">
              إجمالي الطلب
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {orderTotal.toLocaleString("ar-EG")} جنيه
            </p>

            <p className="mt-2 text-xs text-gray-500">
              طريقة الدفع: الدفع عند الاستلام
            </p>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            {trackingCode && (
              <Link
                href={`/track?code=${trackingCode}`}
                className="inline-flex items-center gap-3 rounded-full border border-black/10 px-8 py-4 text-sm"
              >
                تتبع الطلب
              </Link>
            )}

            <Link
              href="/products"
              className="inline-flex items-center gap-3 rounded-full bg-black px-8 py-4 text-sm text-white"
            >
              العودة للمنتجات
              <ArrowLeft size={18} />
            </Link>
          </div>

        </div>
      </main>
    )
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--bg)]">

      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">

          <Link href="/" className="flex items-center">
            <SiteLogo className="h-10 w-auto object-contain" />
          </Link>

          <Link
            href="/cart"
            className="flex items-center gap-2 text-sm text-gray-600"
          >
            <ArrowRight size={18} />
            العودة للسلة
          </Link>

        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">

        <div className="mb-10">
          <p className="mb-2 text-sm text-[var(--brand-dark)]">
            DAHAB STORE
          </p>

          <h1 className="font-serif text-4xl md:text-5xl">
            إتمام الطلب
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            أدخل بيانات التوصيل وسنتواصل معك لتأكيد الطلب.
          </p>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

            {/* Customer Information */}

            <div className="space-y-6">

              <div className="rounded-3xl border border-black/5 bg-white p-6 sm:p-8">

                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg)]">
                    <User size={20} strokeWidth={1.5} />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold">
                      بيانات العميل
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      البيانات المطلوبة للتواصل معك
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      الاسم بالكامل *
                    </span>

                    <div className="relative">
                      <User
                        size={17}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: محمد إبراهيم"
                        className="w-full rounded-2xl border border-black/10 bg-white py-3.5 pr-11 pl-4 text-sm outline-none transition focus:border-black"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      رقم الموبايل *
                    </span>

                    <div className="relative">
                      <Phone
                        size={17}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="01xxxxxxxxx"
                        inputMode="tel"
                        className="w-full rounded-2xl border border-black/10 bg-white py-3.5 pr-11 pl-4 text-sm outline-none transition focus:border-black"
                      />
                    </div>
                  </label>

                </div>

              </div>

              {/* Address */}

              <div className="rounded-3xl border border-black/5 bg-white p-6 sm:p-8">

                <div className="mb-7 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg)]">
                    <MapPin size={20} strokeWidth={1.5} />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold">
                      عنوان التوصيل
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      أين تريد استلام الطلب؟
                    </p>
                  </div>
                </div>

                <div className="space-y-5">

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      المحافظة *
                    </span>

                    <select
                      value={governorate}
                      onChange={(e) => setGovernorate(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none focus:border-black"
                    >
                      <option value="">
                        اختر المحافظة
                      </option>

                      {governorates.map((gov) => (
                        <option key={gov} value={gov}>
                          {gov}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      المنطقة / المركز *
                    </span>

                    <input
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="مثال: أشمون"
                      className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none focus:border-black"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium">
                      العنوان بالتفصيل *
                    </span>

                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="اسم الشارع، رقم المنزل، الدور، الشقة..."
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none focus:border-black"
                    />
                  </label>

                </div>

              </div>

              {/* Notes */}

              <div className="rounded-3xl border border-black/5 bg-white p-6 sm:p-8">

                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bg)]">
                    <FileText size={20} strokeWidth={1.5} />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold">
                      ملاحظات الطلب
                    </h2>

                    <p className="mt-1 text-xs text-gray-500">
                      اختياري
                    </p>
                  </div>
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظات خاصة بالتوصيل أو الطلب..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-black/10 bg-white px-4 py-3.5 text-sm outline-none focus:border-black"
                />

              </div>

            </div>

            {/* Order Summary */}

            <aside className="h-fit rounded-3xl border border-black/5 bg-white p-6 lg:sticky lg:top-28">

              <div className="flex items-center justify-between">

                <h2 className="text-xl font-semibold">
                  ملخص الطلب
                </h2>

                <span className="rounded-full bg-[var(--bg)] px-3 py-1 text-xs">
                  {cart.length} منتجات
                </span>

              </div>

              <div className="mt-6 space-y-4">

                {cart.map((item) => (

                  <div
                    key={`${item.id}-${item.selectedColor || ""}-${item.selectedSize || ""}`}
                    className="flex gap-3"
                  >

                    <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-[var(--surface)]">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>

                      {(item.selectedColor || item.selectedSize) && (
                        <p className="mt-1 text-xs text-gray-400">
                          {item.selectedColor && `اللون: ${item.selectedColor}`}
                          {item.selectedColor && item.selectedSize && " • "}
                          {item.selectedSize && `المقاس: ${item.selectedSize}`}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-gray-500">
                        الكمية: {item.quantity}
                      </p>

                    </div>

                    <p className="shrink-0 text-sm font-semibold">
                      {(item.price * item.quantity).toLocaleString("ar-EG")} جنيه
                    </p>

                  </div>

                ))}

              </div>

              <div className="my-6 border-t" />

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  المنتجات
                </span>

                <span>
                  {cartTotal.toLocaleString("ar-EG")} جنيه
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  الشحن
                </span>

                <span className="text-gray-500">
                  يُحدد حسب المنطقة
                </span>
              </div>

              <div className="my-6 border-t" />

              <div className="flex items-center justify-between">

                <span className="font-semibold">
                  الإجمالي
                </span>

                <span className="text-2xl font-semibold">
                  {cartTotal.toLocaleString("ar-EG")} جنيه
                </span>

              </div>

              {/* Payment */}

              <div className="mt-6 rounded-2xl border border-black/10 p-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bg)]">
                    <ShoppingBag size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold">
                      الدفع عند الاستلام
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      ادفع عند وصول طلبك
                    </p>
                  </div>

                </div>

              </div>

              {error && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-black py-4 text-sm text-white transition hover:bg-[var(--brand-dark)] disabled:opacity-60"
              >
                {submitting ? "جارِ إرسال الطلب..." : "تأكيد الطلب"}
                {!submitting && <ArrowLeft size={18} />}
              </button>

              <p className="mt-4 text-center text-[11px] leading-5 text-gray-400">
                بالضغط على تأكيد الطلب، أنت توافق على إتمام الطلب
                والتواصل معك لتأكيد بيانات التوصيل.
              </p>

            </aside>

          </div>

        </form>

      </section>

    </main>
  )
}
