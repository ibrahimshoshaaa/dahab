"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowRight, PackageSearch } from "lucide-react"
import { fetchOrderByCode } from "../lib/api"

type OrderResult = {
  order: {
    id: number
    status: string
    total: number
    customer_name: string
    created_at: string
  }
  items: {
    product_name: string
    quantity: number
    price: number
    selected_color: string | null
    selected_size: string | null
  }[]
}

function TrackContent() {
  const searchParams = useSearchParams()
  const initialCode = searchParams.get("code") || ""

  const [codeInput, setCodeInput] = useState(initialCode)
  const [result, setResult] = useState<OrderResult | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSearch(code: string) {
    if (!code.trim()) return

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const data = await fetchOrderByCode(code)
      setResult(data as unknown as OrderResult)
    } catch {
      setError("لم يتم العثور على طلب بهذا الكود")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      handleSearch(initialCode)
    }
  }, [initialCode])

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf8f4]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="font-serif text-3xl tracking-widest">
            DAHAB
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

      <section className="mx-auto max-w-xl px-5 py-16">
        <div className="mb-8 text-center">
          <PackageSearch size={38} strokeWidth={1.3} className="mx-auto mb-4" />
          <h1 className="font-serif text-3xl">تتبع طلبك</h1>
          <p className="mt-2 text-sm text-gray-500">
            أدخلي كود التتبع (8 أحرف) الذي وصلك بعد إتمام الطلب
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSearch(codeInput)
          }}
          className="flex gap-3"
        >
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            placeholder="كود التتبع — مثال: K7M2QXA9"
            autoCapitalize="characters"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 font-mono text-sm tracking-widest outline-none focus:border-black"
          />

          <button
            type="submit"
            className="shrink-0 rounded-2xl bg-black px-6 py-3.5 text-sm text-white"
          >
            بحث
          </button>
        </form>

        {loading && (
          <p className="mt-8 text-center text-sm text-gray-500">
            جارِ البحث...
          </p>
        )}

        {error && (
          <p className="mt-8 rounded-2xl bg-red-50 px-4 py-4 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-8 rounded-3xl border border-black/5 bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                طلب رقم #DAH-{result.order.id} — {result.order.customer_name}
              </p>

              <span className="rounded-full bg-[#faf8f4] px-4 py-1.5 text-sm font-medium">
                {result.order.status}
              </span>
            </div>

            <div className="my-5 border-t" />

            <div className="space-y-3">
              {result.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4 text-sm">
                  <div>
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>

                    {(item.selected_color || item.selected_size) && (
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
                        {item.selected_color && (
                          <span className="rounded-full bg-[#faf8f4] px-2.5 py-1">
                            اللون: {item.selected_color}
                          </span>
                        )}
                        {item.selected_size && (
                          <span className="rounded-full bg-[#faf8f4] px-2.5 py-1">
                            المقاس: {item.selected_size}
                          </span>
                        )}
                      </p>
                    )}
                  </div>

                  <span className="shrink-0 text-gray-500">
                    {(item.price * item.quantity).toLocaleString("ar-EG")} جنيه
                  </span>
                </div>
              ))}
            </div>

            <div className="my-5 border-t" />

            <div className="flex items-center justify-between font-semibold">
              <span>الإجمالي</span>
              <span>{result.order.total.toLocaleString("ar-EG")} جنيه</span>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default function TrackPage() {
  return (
    <Suspense fallback={null}>
      <TrackContent />
    </Suspense>
  )
}
