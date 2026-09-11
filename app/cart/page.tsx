"use client"

import Link from "next/link"
import {
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react"
import { useCart } from "../context/CartContext"

export default function CartPage() {
  const {
    cart,
    cartCount,
    cartTotal,
    updateQuantity,
    removeFromCart,
    mounted,
  } = useCart()

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--bg)]">

      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">

          <Link
            href="/"
            className="font-serif text-3xl tracking-widest"
          >
            DAHAB
          </Link>

          <div className="flex items-center gap-5">
            <Link href="/track" className="text-sm text-gray-500 hover:text-black">
              تتبع طلب
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              <ArrowRight size={18} />
              متابعة التسوق
            </Link>
          </div>

        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">

        <div className="mb-10">
          <p className="mb-2 text-sm text-[var(--brand-dark)]">
            DAHAB STORE
          </p>

          <h1 className="font-serif text-4xl md:text-5xl">
            سلة التسوق
          </h1>

          {cart.length > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              {mounted ? cartCount : 0} منتج في السلة
            </p>
          )}
        </div>

        {cart.length === 0 ? (

          <div className="flex min-h-[450px] flex-col items-center justify-center rounded-3xl border border-black/5 bg-white px-5 text-center">

            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bg)]">
              <ShoppingBag size={32} strokeWidth={1.3} />
            </div>

            <h2 className="text-2xl font-semibold">
              سلة التسوق فارغة
            </h2>

            <p className="mt-3 max-w-md text-sm leading-7 text-gray-500">
              لم تقم بإضافة أي منتجات إلى السلة حتى الآن.
              اكتشف منتجات دهب واختر ما يناسبك.
            </p>

            <Link
              href="/products"
              className="mt-7 flex items-center gap-3 rounded-full bg-black px-7 py-3.5 text-sm text-white transition hover:bg-[var(--brand-dark)]"
            >
              اكتشف المنتجات
              <ArrowLeft size={18} />
            </Link>

          </div>

        ) : (

          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

            <div className="space-y-4">

              {cart.map((item) => (

                <div
                  key={`${item.id}-${item.selectedColor || ""}-${item.selectedSize || ""}`}
                  className="rounded-3xl border border-black/5 bg-white p-4 sm:p-5"
                >

                  <div className="flex gap-4 sm:gap-6">

                    <Link
                      href={`/products/${item.slug}`}
                      className="h-32 w-24 shrink-0 overflow-hidden rounded-2xl bg-[var(--surface)] sm:h-40 sm:w-32"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">

                      <div className="flex items-start justify-between gap-3">

                        <div>
                          <p className="text-xs text-[var(--brand-dark)]">
                            {item.category}
                          </p>

                          <Link
                            href={`/products/${item.slug}`}
                            className="mt-1 block text-base font-semibold sm:text-lg"
                          >
                            {item.name}
                          </Link>
                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(
                              item.id,
                              item.selectedColor,
                              item.selectedSize
                            )
                          }
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label="حذف المنتج"
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">

                        {item.selectedColor && (
                          <span className="rounded-full bg-[var(--bg)] px-3 py-1 text-xs text-gray-600">
                            اللون: {item.selectedColor}
                          </span>
                        )}

                        {item.selectedSize && (
                          <span className="rounded-full bg-[var(--bg)] px-3 py-1 text-xs text-gray-600">
                            المقاس: {item.selectedSize}
                          </span>
                        )}

                      </div>

                      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">

                        <div className="flex h-10 items-center rounded-full border bg-white">

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity - 1,
                                item.selectedColor,
                                item.selectedSize
                              )
                            }
                            className="flex h-10 w-10 items-center justify-center"
                          >
                            <Minus size={15} />
                          </button>

                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              updateQuantity(
                                item.id,
                                item.quantity + 1,
                                item.selectedColor,
                                item.selectedSize
                              )
                            }
                            className="flex h-10 w-10 items-center justify-center"
                          >
                            <Plus size={15} />
                          </button>

                        </div>

                        <div className="text-left">

                          <p className="text-lg font-semibold">
                            {(item.price * item.quantity).toLocaleString("ar-EG")} جنيه
                          </p>

                          {item.quantity > 1 && (
                            <p className="mt-1 text-xs text-gray-400">
                              {item.price.toLocaleString("ar-EG")} جنيه × {item.quantity}
                            </p>
                          )}

                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

            <aside className="h-fit rounded-3xl border border-black/5 bg-white p-6 lg:sticky lg:top-28">

              <h2 className="text-xl font-semibold">
                ملخص الطلب
              </h2>

              <div className="mt-6 space-y-4 border-b pb-6">

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    المنتجات
                  </span>

                  <span>
                    {cartTotal.toLocaleString("ar-EG")} جنيه
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    الشحن
                  </span>

                  <span className="text-gray-500">
                    يُحسب عند إتمام الطلب
                  </span>
                </div>

              </div>

              <div className="mt-6 flex items-center justify-between">

                <span className="font-semibold">
                  الإجمالي
                </span>

                <span className="text-2xl font-semibold">
                  {cartTotal.toLocaleString("ar-EG")} جنيه
                </span>

              </div>

              <Link
                href="/checkout"
                className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-black py-4 text-sm text-white transition hover:bg-[var(--brand-dark)]"
              >
                إتمام الطلب
                <ArrowLeft size={18} />
              </Link>

              <Link
                href="/products"
                className="mt-3 flex w-full items-center justify-center rounded-full border border-black/10 py-3.5 text-sm transition hover:bg-[var(--bg)]"
              >
                متابعة التسوق
              </Link>

              <div className="mt-6 rounded-2xl bg-[var(--bg)] p-4 text-center">
                <p className="text-xs leading-6 text-gray-500">
                  الدفع عند الاستلام متاح لجميع المحافظات
                </p>
              </div>

            </aside>

          </div>

        )}

      </section>

    </main>
  )
}
