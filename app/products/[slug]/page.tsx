"use client"

import { use, useEffect, useRef, useState } from "react"
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
  Star,
} from "lucide-react"
import { type Product } from "../../data/products"
import { fetchProductBySlug, fetchProducts, fetchProductReviews, submitProductReview, trackEvent, type ProductReview } from "../../lib/api"
import { useCart } from "../../context/CartContext"
import { useFavorites } from "../../context/FavoritesContext"
import SiteHeader from "../../components/SiteHeader"
import ProductCardImages from "../../components/ProductCardImages"
import StoreFooter from "../../components/StoreFooter"

export default function ProductDetails({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const [product, setProduct] = useState<Product | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])

  const { addToCart } = useCart()
  const { toggleFavorite, isFavorite } = useFavorites()

  const [selectedColor, setSelectedColor] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [reviewAverage, setReviewAverage] = useState(0)
  const [reviewName, setReviewName] = useState("")
  const [reviewComment, setReviewComment] = useState("")
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewMessage, setReviewMessage] = useState("")
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

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
      if (result) {
        fetchProductReviews(result.id).then((data) => { if (active) { setReviews(data.reviews); setReviewAverage(data.average) } }).catch(() => {})
        trackEvent({event_type:"product_view",product_id:result.id,path:`/products/${slug}`})
      }
    })

    fetchProducts().then((all) => {
      if (!active) return
      setRelatedProducts(all.filter((item) => item.slug !== slug).slice(0, 4))
    })

    return () => {
      active = false
    }
  }, [slug])

  const galleryImages = product?.images?.length ? product.images : product ? [product.image] : []

  const variantKey = product ? `${selectedColor || "-"}|${selectedSize || "-"}` : ""
  const hasVariantStock = !!product?.variantStock && Object.keys(product.variantStock).length > 0
  const availableStock = product ? (hasVariantStock ? Number(product.variantStock?.[variantKey] ?? 0) : Number(product.stock ?? 0)) : 0

  const galleryTouchStartX = useRef<number | null>(null)

  function handleGalleryTouchStart(e: React.TouchEvent) {
    galleryTouchStartX.current = e.touches[0].clientX
  }

  function handleGalleryTouchEnd(e: React.TouchEvent) {
    if (galleryTouchStartX.current === null || galleryImages.length <= 1) return
    const delta = e.changedTouches[0].clientX - galleryTouchStartX.current
    const threshold = 40
    const total = galleryImages.length

    if (delta < -threshold) {
      setActiveImage((current) => (current + 1) % total)
    } else if (delta > threshold) {
      setActiveImage((current) => (current - 1 + total) % total)
    }

    galleryTouchStartX.current = null
  }

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
    if (availableStock <= 0) return
    addToCart(
      product!,
      Math.min(quantity, availableStock),
      selectedColor || undefined,
      selectedSize || undefined
    )

    setAdded(true)
    trackEvent({event_type:"add_to_cart",product_id:product.id,path:`/products/${slug}`,metadata:{quantity:Math.min(quantity,availableStock),color:selectedColor,size:selectedSize}})
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

      <SiteHeader />

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
            <div
              className="relative aspect-[4/5] touch-pan-y select-none overflow-hidden rounded-3xl bg-white"
              onTouchStart={handleGalleryTouchStart}
              onTouchEnd={handleGalleryTouchEnd}
            >
              <img
                src={galleryImages[activeImage] || product.image}
                alt={product.name}
                className="h-full w-full object-cover"
                draggable={false}
              />

              <button
                onClick={() => toggleFavorite(product)}
                className={`absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full transition ${
                  isFavorite(product.id) ? "bg-[var(--brand-dark)] text-white" : "bg-white/90"
                }`}
                aria-label="إضافة للمفضلة"
              >
                <Heart size={18} className={isFavorite(product.id) ? "fill-white" : ""} />
              </button>

              {galleryImages.length > 1 && (
                <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                  {galleryImages.map((_, index) => (
                    <span
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${
                        activeImage === index ? "w-5 bg-white" : "w-1.5 bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              )}
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

            {/* الكمية + الأزرار */}

            <div className="mt-7">

              <div className={`mb-4 rounded-2xl px-4 py-3 text-sm ${availableStock <= 0 ? "bg-red-50 text-red-700" : availableStock <= (product.lowStockThreshold ?? 5) ? "bg-amber-50 text-amber-700" : "bg-[var(--bg)] text-gray-600"}`}>
                  {availableStock <= 0 ? "هذا الاختيار غير متوفر حاليًا" : availableStock <= (product.lowStockThreshold ?? 5) ? `متبقي ${availableStock} فقط — اطلبي الآن` : `متوفر — ${availableStock} قطعة`}
                </div>

              <h3 className="mb-3 font-semibold">
                الكمية
              </h3>

              <div className="flex gap-3">

                <div className="flex h-14 shrink-0 items-center rounded-full border bg-white">

                  <button
                    onClick={() =>
                      setQuantity((value) => Math.max(1, value - 1))
                    }
                    className="flex h-14 w-12 items-center justify-center"
                  >
                    <Minus size={17} />
                  </button>

                  <span className="w-10 text-center font-medium">
                    {quantity}
                  </span>

                  <button
                    onClick={() => setQuantity((value) => Math.min(availableStock, value + 1))}
                    disabled={availableStock <= quantity}
                    className="flex h-14 w-12 items-center justify-center disabled:opacity-30"
                  >
                    <Plus size={17} />
                  </button>

                </div>

                {added ? (
                  <button
                    onClick={handleAddToCart}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-green-700 py-4 text-green-700 transition hover:bg-green-50"
                  >
                    <Check size={20} />
                    تمت الإضافة ✓
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={availableStock <= 0}
                    className="flex flex-1 items-center justify-center gap-3 rounded-full bg-black py-4 text-white transition hover:bg-[var(--brand-dark)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ShoppingBag size={20} />
                    {availableStock <= 0 ? "غير متوفر" : "إضافة للسلة"}
                  </button>
                )}

              </div>

              <Link
                href={availableStock <= 0 ? "#" : "/checkout"}
                onClick={(e) => { if (availableStock <= 0) e.preventDefault(); else handleAddToCart() }}
                className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[var(--brand-dark)] py-4 text-white transition hover:bg-black"
              >
                <Sparkles size={18} />
                اشتري الآن
              </Link>

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

            {product.sizeChart && (product.sizeChart.columns?.length ?? 0) > 0 && (product.sizeChart.rows?.length ?? 0) > 0 && (
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

        {/* التقييمات */}
        <section className="mt-16 border-t pt-10">
          <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
            <div className="rounded-3xl bg-white p-6">
              <p className="text-xs tracking-[.2em] text-[var(--brand)]">CUSTOMER LOVE</p>
              <h2 className="mt-2 text-2xl font-light">تقييمات عميلات دهب</h2>
              <div className="mt-6 flex items-center gap-3"><span className="text-4xl font-semibold">{reviewAverage.toFixed(1)}</span><div><div className="flex text-[var(--brand)]">{[1,2,3,4,5].map(i=><Star key={i} size={17} className={i<=Math.round(reviewAverage)?"fill-current":""}/>)}</div><p className="mt-1 text-xs text-gray-400">{reviews.length} تقييم معتمد</p></div></div>
              <div className="mt-6 border-t pt-5"><p className="text-sm font-medium">شاركينا رأيك</p><input value={reviewName} onChange={e=>setReviewName(e.target.value)} placeholder="اسمك" className="mt-3 w-full rounded-xl border border-black/10 px-3 py-3 text-sm outline-none"/><div className="mt-3 flex gap-1">{[1,2,3,4,5].map(i=><button type="button" key={i} onClick={()=>setReviewRating(i)} aria-label={`${i} نجوم`}><Star size={22} className={i<=reviewRating?"fill-[var(--brand)] text-[var(--brand)]":"text-gray-300"}/></button>)}</div><textarea value={reviewComment} onChange={e=>setReviewComment(e.target.value)} placeholder="اكتبي رأيك في المنتج..." rows={3} className="mt-3 w-full resize-none rounded-xl border border-black/10 px-3 py-3 text-sm outline-none"/><button type="button" disabled={reviewSubmitting} onClick={async()=>{setReviewSubmitting(true);setReviewMessage("");try{await submitProductReview(product.id,{customer_name:reviewName,rating:reviewRating,comment:reviewComment});setReviewName("");setReviewComment("");setReviewMessage("تم إرسال تقييمك، وهيظهر بعد المراجعة ❤️")}catch(e){setReviewMessage(e instanceof Error?e.message:"تعذر إرسال التقييم")}finally{setReviewSubmitting(false)}}} className="mt-3 w-full rounded-full bg-black py-3 text-sm text-white disabled:opacity-50">{reviewSubmitting?"جارِ الإرسال...":"إرسال التقييم"}</button>{reviewMessage&&<p className="mt-3 text-center text-xs text-gray-500">{reviewMessage}</p>}</div>
            </div>
            <div className="space-y-3">
              {reviews.length?reviews.map(r=><article key={r.id} className="rounded-2xl border border-black/5 bg-white p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium">{r.customer_name}</p><p className="mt-1 text-[11px] text-gray-400">{new Date(r.created_at).toLocaleDateString("ar-EG")}</p></div><div className="flex text-[var(--brand)]">{[1,2,3,4,5].map(i=><Star key={i} size={14} className={i<=r.rating?"fill-current":""}/>)}</div></div><p className="mt-4 text-sm leading-7 text-gray-600">{r.comment}</p></article>):<div className="rounded-2xl bg-white p-10 text-center text-sm text-gray-400">لسه مفيش تقييمات معتمدة. كوني أول واحدة تسيبي رأيك ❤️</div>}
            </div>
          </div>
        </section>

        {/* منتجات قد تعجبك */}

        {relatedProducts.length > 0 && (
          <div className="mt-16 border-t pt-10">
            <h2 className="mb-6 text-2xl font-light sm:text-3xl">
              قد يعجبك أيضًا
            </h2>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {relatedProducts.map((item) => (
                <Link key={item.slug} href={`/products/${item.slug}`} className="group block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[var(--surface)]">
                    <ProductCardImages
                      images={item.images?.length ? item.images : [item.image]}
                      alt={item.name}
                      imgClassName="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="pt-4">
                    <h3 className="text-sm">{item.name}</h3>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-medium">{item.price} ج.م</span>
                      {item.oldPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {item.oldPrice} ج.م
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </section>

      <StoreFooter />

    </main>
  )
}
