"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Search, SlidersHorizontal, Heart } from "lucide-react"
import { products as mockProducts, type Product } from "../data/products"
import { fetchProducts } from "../lib/api"
import { useFavorites } from "../context/FavoritesContext"
import SiteHeader from "../components/SiteHeader"

function ProductsContent() {
  const searchParams = useSearchParams()
  const urlCategory = searchParams.get("category")
  const initialCategory = urlCategory ?? "الكل"

  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [isLoaded, setIsLoaded] = useState(false)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState(initialCategory)
  const [sort, setSort] = useState("default")
  const { toggleFavorite, isFavorite } = useFavorites()

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .finally(() => setIsLoaded(true))
  }, [])

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.toLowerCase())

      const matchesCategory =
        category === "الكل" || product.category === category

      return matchesSearch && matchesCategory
    })

    if (sort === "low") {
      result = [...result].sort((a, b) => a.price - b.price)
    }

    if (sort === "high") {
      result = [...result].sort((a, b) => b.price - a.price)
    }

    return result
  }, [search, category, sort, products])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-dark)] border-t-transparent" />
      </div>
    )
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--bg)]">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm tracking-[0.3em] text-[var(--brand-dark)]">
            DAHAB COLLECTION
          </p>

          <h1 className="font-serif text-4xl md:text-5xl">
            كل المنتجات
          </h1>

          <p className="mt-4 text-gray-500">
            اكتشفي تشكيلتنا المختارة بعناية من العبايات والإكسسوارات
          </p>
        </div>

        <div className="mb-10 grid gap-4 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border px-4">
            <Search size={20} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحثي عن منتج..."
              className="w-full bg-transparent py-3 outline-none"
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl border px-4">
            <SlidersHorizontal size={20} />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-transparent py-3 outline-none"
            >
              <option value="الكل">كل الأقسام</option>
              <option value="عبايات">العبايات</option>
              <option value="حقائب">الحقائب</option>
              <option value="طرح">الطرح</option>
            </select>
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border bg-white px-4 py-3 outline-none"
          >
            <option value="default">ترتيب المنتجات</option>
            <option value="low">السعر: من الأقل للأعلى</option>
            <option value="high">السعر: من الأعلى للأقل</option>
          </select>
        </div>

        <div className="mb-6 text-sm text-gray-500">
          {filteredProducts.length} منتجات
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {filteredProducts.map((product) => (
            <Link
              href={`/products/${product.slug}`}
              key={product.id}
              className="group"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#eee]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />

                {product.badge && (
                  <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs">
                    {product.badge}
                  </span>
                )}

                <button
                  onClick={(e) => {
                    e.preventDefault()
                    toggleFavorite(product)
                  }}
                  className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90"
                  aria-label="إضافة للمفضلة"
                >
                  <Heart
                    size={16}
                    strokeWidth={1.5}
                    className={isFavorite(product.id) ? "fill-[var(--brand-dark)] text-[var(--brand-dark)]" : ""}
                  />
                </button>
              </div>

              <div className="pt-4">
                <p className="mb-1 text-xs text-gray-400">
                  {product.category}
                </p>

                <h2 className="font-medium">{product.name}</h2>

                <div className="mt-2 flex items-center gap-2">
                  <span className="font-semibold">
                    {product.price.toLocaleString("ar-EG")} جنيه
                  </span>

                  {product.oldPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      {product.oldPrice.toLocaleString("ar-EG")} جنيه
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-20 text-center text-gray-500">
            لا توجد منتجات مطابقة للبحث.
          </div>
        )}
      </section>
    </main>
  )
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  )
}
