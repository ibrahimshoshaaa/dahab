"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Plus,
  Minus,
} from "lucide-react"
import { type Product } from "../../data/products"
import { fetchProductBySlug } from "../../lib/api"
import { useCart } from "../../context/CartContext"
import { useFavorites } from "../../context/FavoritesContext"

export default function ProductDetails({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const [product, setProduct] = useState<Product | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const { addToCart } = useCart()
  const { toggleFavorite, isFavorite } = useFavorites()

  const [selectedColor, setSelectedColor] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    let active = true

    fetchProductBySlug(slug).then((result) => {
      if (!active) return
      setProduct(result)
      setSelectedColor(result?.colors[0] || "")
      setSelectedSize(result?.sizes[0] || "")
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [slug])

  if (!product && !loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#faf8f4]"
      >
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-semibold">
            المنتج غير موجود
          </h1>

          <Link
            href="/products"
            className="inline-block rounded-full bg-black px-6 py-3 text-white"
          >
            العودة للمنتجات
          </Link>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#faf8f4]"
      >
        <p className="text-sm text-gray-500">جارِ التحميل...</p>
      </main>
    )
  }

  function handleAddToCart() {
    addToCart(
      product!,
      quantity,
      selectedColor || undefined,
      selectedSize || undefined
    )

    setAdded(true)

    setTimeout(() => {
      setAdded(false)
    }, 2000)
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[#faf8f4]">

      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">

          <Link
            href="/"
            className="font-serif text-3xl tracking-widest"
          >
            DAHAB
          </Link>

          <Link
            href="/cart"
            className="flex items-center gap-2"
          >
            <ShoppingBag size={22} />
          </Link>

        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">

        <Link
          href="/products"
          className="mb-8 flex items-center gap-2 text-sm text-gray-500"
        >
          <ArrowRight size={18} />
          العودة لكل المنتجات
        </Link>

        <div className="grid gap-10 md:grid-cols-2">

          {/* صورة المنتج */}

          <div className="overflow-hidden rounded-3xl bg-white">
            <img
              src={product.image}
              alt={product.name}
              className="h-full max-h-[700px] w-full object-cover"
            />
          </div>

          {/* بيانات المنتج */}

          <div className="flex flex-col justify-center">

            <p className="mb-3 text-sm text-[#a07845]">
              {product.category}
            </p>

            <h1 className="font-serif text-4xl md:text-5xl">
              {product.name}
            </h1>

            <div className="mt-5 flex items-center gap-3">

              <span className="text-2xl font-semibold">
                {product.price.toLocaleString("ar-EG")} جنيه
              </span>

              {product.oldPrice && (
                <span className="text-lg text-gray-400 line-through">
                  {product.oldPrice.toLocaleString("ar-EG")} جنيه
                </span>
              )}

            </div>

            <p className="mt-6 leading-8 text-gray-600">
              {product.description}
            </p>

            {/* اللون */}

            {product.colors.length > 0 && (
              <div className="mt-8">

                <h3 className="mb-3 font-semibold">
                  اللون:{" "}
                  <span className="font-normal text-gray-500">
                    {selectedColor}
                  </span>
                </h3>

                <div className="flex flex-wrap gap-2">

                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`rounded-full border px-5 py-2 transition ${
                        selectedColor === color
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {color}
                    </button>
                  ))}

                </div>

              </div>
            )}

            {/* المقاس */}

            {product.sizes.length > 0 && (
              <div className="mt-6">

                <h3 className="mb-3 font-semibold">
                  المقاس:{" "}
                  <span className="font-normal text-gray-500">
                    {selectedSize}
                  </span>
                </h3>

                <div className="flex flex-wrap gap-2">

                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`h-11 min-w-12 rounded-lg border px-4 transition ${
                        selectedSize === size
                          ? "border-black bg-black text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {size}
                    </button>
                  ))}

                </div>

              </div>
            )}

            {/* الكمية */}

            <div className="mt-7">

              <h3 className="mb-3 font-semibold">
                الكمية
              </h3>

              <div className="flex h-12 w-fit items-center rounded-full border bg-white">

                <button
                  onClick={() =>
                    setQuantity((value) => Math.max(1, value - 1))
                  }
                  className="flex h-12 w-12 items-center justify-center"
                >
                  <Minus size={17} />
                </button>

                <span className="w-10 text-center font-medium">
                  {quantity}
                </span>

                <button
                  onClick={() =>
                    setQuantity((value) => value + 1)
                  }
                  className="flex h-12 w-12 items-center justify-center"
                >
                  <Plus size={17} />
                </button>

              </div>

            </div>

            {/* الأزرار */}

            <div className="mt-8 flex gap-3">

              <button
                onClick={handleAddToCart}
                className={`flex flex-1 items-center justify-center gap-3 rounded-full py-4 text-white transition ${
                  added
                    ? "bg-green-700"
                    : "bg-black hover:bg-[#a07845]"
                }`}
              >

                <ShoppingBag size={20} />

                {added
                  ? "تمت الإضافة للسلة ✓"
                  : "إضافة للسلة"}

              </button>

              <button
                onClick={() => toggleFavorite(product)}
                className={`flex h-14 w-14 items-center justify-center rounded-full border transition ${
                  isFavorite(product.id)
                    ? "border-[#a07845] bg-[#a07845] text-white"
                    : "border-gray-300 bg-white"
                }`}
                aria-label="إضافة للمفضلة"
              >
                <Heart size={21} className={isFavorite(product.id) ? "fill-white" : ""} />
              </button>

            </div>

            {/* المميزات */}

            <div className="mt-8 grid gap-4 border-t pt-6 sm:grid-cols-3">

              <div className="flex items-center gap-3">
                <Truck size={22} />
                <span className="text-sm">
                  توصيل لكل مصر
                </span>
              </div>

              <div className="flex items-center gap-3">
                <ShieldCheck size={22} />
                <span className="text-sm">
                  منتجات أصلية
                </span>
              </div>

              <div className="flex items-center gap-3">
                <ShoppingBag size={22} />
                <span className="text-sm">
                  دفع عند الاستلام
                </span>
              </div>

            </div>

          </div>

        </div>

      </section>

    </main>
  )
}
