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
  Check,
  Sparkles,
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
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    let active = true

    fetchProductBySlug(slug).then((result) => {
      if (!active) return
      setProduct(result)
      setSelectedColor(result?.colors[0] || "")
      setSelectedSize(result?.sizes[0] || "")
      setActiveImage(0)
      setAdded(false)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [slug])

  const galleryImages = product?.images?.length ? product.images : product ? [product.image] : []

  if (!product && !loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[var(--bg)]"
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
        className="flex min-h-screen items-center justify-center bg-[var(--bg)]"
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
  }

  function handleColorSelect(color: string) {
    setSelectedColor(color)
    setAdded(false)
  }

  function handleSizeSelect(size: string) {
    setSelectedSize(size)
    setAdded(false)
  }

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

          <div>
            <div className="overflow-hidden rounded-3xl bg-white">
              <img
                src={galleryImages[activeImage] || product.image}
                alt={product.name}
                className="h-full max-h-[700px] w-full object-cover"
              />
            </div>

            {galleryImages.length > 1 && (
              <div className="mt-3 flex gap-3">
                {galleryImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={`h-20 w-20 overflow-hidden rounded-xl border-2 transition ${
                      activeImage === index
                        ? "border-[var(--brand-dark)]"
                        : "border-transparent"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* بيانات المنتج */}

          <div className="flex flex-col justify-center">

            <p className="mb-3 text-sm text-[var(--brand-dark)]">
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
                      onClick={() => handleColorSelect(color)}
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
                      onClick={() => handleSizeSelect(size)}
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

              {added ? (
                <>
                  <button
                    onClick={handleAddToCart}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-green-700 py-4 text-green-700 transition hover:bg-green-50"
                  >
                    <Check size={20} />
                    تمت الإضافة ✓
                  </button>

                  <Link
                    href="/checkout"
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand-dark)] py-4 text-white transition hover:bg-black"
                  >
                    <Sparkles size={18} />
                    إتمام الطلب
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="flex flex-1 items-center justify-center gap-3 rounded-full bg-black py-4 text-white transition hover:bg-[var(--brand-dark)]"
                >
                  <ShoppingBag size={20} />
                  إضافة للسلة
                </button>
              )}

              <button
                onClick={() => toggleFavorite(product)}
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border transition ${
                  isFavorite(product.id)
                    ? "border-[var(--brand-dark)] bg-[var(--brand-dark)] text-white"
                    : "border-gray-300 bg-white"
                }`}
                aria-label="إضافة للمفضلة"
              >
                <Heart size={21} className={isFavorite(product.id) ? "fill-white" : ""} />
              </button>

            </div>

            {added && (
              <p className="mt-3 text-sm text-gray-500">
                تقدري تكملي التسوق وتزودي حاجات تانية للسلة، أو تدخلي على السلة وتراجعيها قبل إتمام الطلب.{" "}
                <Link href="/cart" className="text-[var(--brand-dark)] underline">
                  عرض السلة
                </Link>
              </p>
            )}

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

            {/* تفاصيل الخامة */}

            {product.materialDetails && (
              <div className="mt-8 border-t pt-6">
                <h3 className="mb-2 font-semibold">تفاصيل الخامة</h3>
                <p className="leading-7 text-gray-600">{product.materialDetails}</p>
              </div>
            )}

            {/* تعليمات العناية */}

            {product.careInstructions && (
              <div className="mt-8 border-t pt-6">
                <h3 className="mb-3 font-semibold">تعليمات العناية</h3>
                <ul className="space-y-2">
                  {product.careInstructions
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                    .map((line, index) => (
                      <li key={index} className="flex items-start gap-2 text-gray-600">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-dark)]" />
                        <span className="leading-6">{line}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {/* جدول المقاسات */}

            {product.sizeChart && product.sizeChart.columns.length > 0 && product.sizeChart.rows.length > 0 && (
              <div className="mt-8 border-t pt-6">
                <h3 className="mb-3 font-semibold">جدول المقاسات</h3>
                <div className="overflow-x-auto rounded-xl border border-black/10">
                  <table className="w-full min-w-max border-collapse text-sm">
                    <thead>
                      <tr className="bg-[var(--bg)]">
                        {product.sizeChart.columns.map((col, index) => (
                          <th
                            key={index}
                            className="border-b border-black/10 px-4 py-3 text-right font-semibold"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {product.sizeChart.rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="odd:bg-white even:bg-[var(--bg)]/50">
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="border-b border-black/5 px-4 py-3 text-gray-600 last:border-b-0"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  المقاسات بالسنتيمتر، وممكن تختلف بنسبة بسيطة حسب الخامة.
                </p>
              </div>
            )}

          </div>

        </div>

      </section>

    </main>
  )
}
