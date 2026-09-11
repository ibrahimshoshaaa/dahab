"use client"

import Link from "next/link"
import { ArrowRight, ArrowLeft, Heart, Trash2, ShoppingBag } from "lucide-react"
import { useFavorites } from "../context/FavoritesContext"
import { useCart } from "../context/CartContext"

export default function FavoritesPage() {
  const { favorites, removeFavorite, mounted } = useFavorites()
  const { addToCart } = useCart()

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--bg)]">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center">
            <img src="/logo.png" alt="دهب" className="h-10 w-auto object-contain" />
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

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-10">
          <p className="mb-2 text-sm text-[var(--brand-dark)]">DAHAB STORE</p>
          <h1 className="font-serif text-4xl md:text-5xl">المفضلة</h1>

          {mounted && favorites.length > 0 && (
            <p className="mt-3 text-sm text-gray-500">
              {favorites.length} منتج في المفضلة
            </p>
          )}
        </div>

        {!mounted || favorites.length === 0 ? (
          <div className="flex min-h-[450px] flex-col items-center justify-center rounded-3xl border border-black/5 bg-white px-5 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--bg)]">
              <Heart size={32} strokeWidth={1.3} />
            </div>

            <h2 className="text-2xl font-semibold">قائمة المفضلة فارغة</h2>

            <p className="mt-3 max-w-md text-sm leading-7 text-gray-500">
              لسه محددتيش أي منتجات في المفضلة. اضغطي على أيقونة القلب
              على أي منتج عشان تضيفيه هنا.
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {favorites.map((product) => (
              <div key={product.id} className="group">
                <div className="relative overflow-hidden rounded-2xl bg-[#eee]">
                  <Link
                    href={`/products/${product.slug}`}
                    className="block aspect-[3/4]"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  </Link>

                  {product.badge && (
                    <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs">
                      {product.badge}
                    </span>
                  )}

                  <button
                    onClick={() => removeFavorite(product.id)}
                    className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="حذف من المفضلة"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="pt-4">
                  <p className="mb-1 text-xs text-gray-400">
                    {product.category}
                  </p>

                  <Link href={`/products/${product.slug}`} className="font-medium hover:underline">
                    {product.name}
                  </Link>

                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-semibold">
                      {product.price.toLocaleString("ar-EG")} جنيه
                    </span>
                    {product.oldPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        {product.oldPrice.toLocaleString("ar-EG")} جنيه
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => addToCart(product, 1)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-black/10 py-2.5 text-sm transition hover:bg-black hover:text-white"
                  >
                    <ShoppingBag size={15} />
                    إضافة للسلة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
