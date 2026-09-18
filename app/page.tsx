"use client";
import { useEffect, useState } from "react"
import type { Product } from "./data/products"
import Link from "next/link"
import { fetchProducts, fetchSettings, type SiteSettings } from "./lib/api"
import { useFavorites } from "./context/FavoritesContext"
import ProductCardImages from "./components/ProductCardImages"

import { Heart, ShoppingBag, ArrowLeft, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import SiteLogo from "./components/SiteLogo"
import SiteHeader from "./components/SiteHeader"
import StoreFooter from "./components/StoreFooter"

const DEFAULT_SETTINGS: SiteSettings = {
  hero_image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=2000&q=90",
  hero_label: "DAHAB COLLECTION",
  hero_title_line1: "أناقتك...",
  hero_title_line2: "بطابع دهب",
  hero_subtitle: "عبايات مصرية بتصميمات راقية تجمع بين الاحتشام والأناقة وتناسب كل لحظة.",
  hero_button_text: "اكتشفي المجموعة",
  collection_abaya_image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=1200&q=90",
  collection_accessories_image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1200&q=90",
  accessories_item1_title: "حقائب",
  accessories_item1_image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=85",
  accessories_item2_title: "إكسسوارات",
  accessories_item2_image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=700&q=85",
  accessories_item3_title: "طرح",
  accessories_item3_image: "https://images.unsplash.com/photo-1601924928378-6bda4b8c3f1d?auto=format&fit=crop&w=700&q=85",
  accessories_item4_title: "لمسات دهب",
  accessories_item4_image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=700&q=85",
  footer_description: "عبايات مصرية وإكسسوارات مختارة بعناية، لأن أناقتك تستحق الأفضل.",
  announcement_bar: "✦ شحن لجميع المحافظات | الدفع عند الاستلام متاح",
}

function s(settings: SiteSettings, key: string): string {
  return settings[key] ?? DEFAULT_SETTINGS[key] ?? ""
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const { toggleFavorite, isFavorite } = useFavorites()

  useEffect(() => {
    Promise.all([
      fetchProducts().then(setProducts).catch(() => setLoadError(true)),
      fetchSettings().then((data) => {
        if (Object.keys(data).length > 0) setSettings(data)
      }).catch(() => setLoadError(true)),
    ]).finally(() => setIsLoaded(true))
  }, [])

  const accessoryItems = [
    [s(settings, "accessories_item1_title"), s(settings, "accessories_item1_image"), "/products?category=إكسسوارات"],
    [s(settings, "accessories_item3_title"), s(settings, "accessories_item3_image"), "/products?category=إكسسوارات"],
  ]

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
      </div>
    )
  }

  if (loadError && products.length === 0) {
    return (
      <main dir="rtl" className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
        <SiteHeader />
        <section className="flex min-h-[60vh] items-center justify-center px-6 text-center">
          <div>
            <h1 className="text-2xl font-light">المتجر غير متاح حاليًا</h1>
            <p className="mt-3 text-sm text-gray-500">حدث خطأ أثناء تحميل بيانات المتجر. حاولي مرة أخرى بعد قليل.</p>
            <button onClick={() => window.location.reload()} className="mt-6 border border-black/20 px-6 py-3 text-sm">إعادة المحاولة</button>
          </div>
        </section>
        <StoreFooter />
      </main>
    )
  }

  return (
    <main dir="rtl" className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">

      <SiteHeader />

      {/* ── Hero ── */}
      <section className="relative min-h-[420px] overflow-hidden sm:min-h-[520px] lg:min-h-[680px]">

        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${s(settings, "hero_image")}')` }}
        />

        <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/30 to-black/5" />

        <div className="relative mx-auto flex min-h-[420px] max-w-7xl items-center px-6 sm:min-h-[520px] lg:min-h-[680px]">

          <div className="max-w-xl text-white">

            <p className="mb-5 text-xs tracking-[0.35em] text-[var(--brand-soft)]">
              {s(settings, "hero_label")}
            </p>

            <h1 className="text-5xl font-light leading-tight sm:text-6xl lg:text-7xl">
              {s(settings, "hero_title_line1")}
              <br />
              <span className="font-serif italic text-[var(--brand-soft)]">
                {s(settings, "hero_title_line2")}
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-8 text-white/80 sm:text-base">
              {s(settings, "hero_subtitle")}
            </p>

            <a
              href="#products"
              className="mt-8 inline-flex items-center gap-4 bg-white px-7 py-4 text-sm text-[var(--ink)] transition hover:bg-[var(--brand-soft)]"
            >
              {s(settings, "hero_button_text")}
              <ArrowLeft size={18} />
            </a>

          </div>
        </div>
      </section>

      {/* ── Collection grid ── */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:py-16 md:py-20">

        <div className="mb-8 text-center sm:mb-12">
          <p className="mb-3 text-[11px] tracking-[0.3em] text-[var(--brand)]">
            EXPLORE DAHAB
          </p>
          <h2 className="text-3xl font-light sm:text-4xl">
            اكتشفي مجموعتنا
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-5">

          <a href="#products" className="group relative h-[280px] overflow-hidden sm:h-[360px] md:h-[480px]">
            <img
              src={s(settings, "collection_abaya_image")}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              alt="العبايات"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-8 right-8 text-white">
              <p className="mb-2 text-xs text-[var(--brand-soft)]">أناقة بتفاصيل مصرية</p>
              <h3 className="text-3xl font-light">العبايات</h3>
              <span className="mt-4 inline-flex items-center gap-2 text-sm">
                تسوقي الآن <ArrowLeft size={16} />
              </span>
            </div>
          </a>

          <a href="#accessories" className="group relative h-[280px] overflow-hidden sm:h-[360px] md:h-[480px]">
            <img
              src={s(settings, "collection_accessories_image")}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              alt="الإكسسوارات"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-8 right-8 text-white">
              <p className="mb-2 text-xs text-[var(--brand-soft)]">كمّلي إطلالتك</p>
              <h3 className="text-3xl font-light">الإكسسوارات</h3>
              <span className="mt-4 inline-flex items-center gap-2 text-sm">
                تسوقي الآن <ArrowLeft size={16} />
              </span>
            </div>
          </a>

        </div>
      </section>

      {/* ── Products grid ── */}
      <section id="products" className="border-y border-black/5 bg-white py-20">

        <div className="mx-auto max-w-7xl px-5">

          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-3 text-[11px] tracking-[0.3em] text-[var(--brand)]">
                NEW SEASON
              </p>
              <h2 id="new" className="text-3xl font-light sm:text-4xl">
                أحدث المنتجات
              </h2>
            </div>
            <a href="#" className="hidden text-sm sm:block">عرض الكل ←</a>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.map((product) => (
              <Link key={product.slug} href={`/products/${product.slug}`} className="group block">
                <div className="relative aspect-[3/4] overflow-hidden bg-[var(--surface)]">
                  <ProductCardImages
                    images={product.images?.length ? product.images : [product.image]}
                    alt={product.name}
                    imgClassName="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute right-3 top-3 bg-white px-3 py-1.5 text-[10px]">
                    {product.badge}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      toggleFavorite(product)
                    }}
                    className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center bg-white/90"
                    aria-label="إضافة للمفضلة"
                  >
                    <Heart
                      size={17}
                      strokeWidth={1.5}
                      className={isFavorite(product.id) ? "fill-[var(--brand)] text-[var(--brand)]" : ""}
                    />
                  </button>
                </div>
                <div className="pt-4">
                  <h3 className="text-sm">{product.name}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm font-medium">{product.price} ج.م</span>
                    {product.oldPrice && (
                      <span className="text-xs text-gray-400 line-through">
                        {product.oldPrice} ج.م
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Best sellers ── */}
      {products.some((p) => p.bestSeller) && (
        <section className="mx-auto max-w-7xl px-5 py-20">
          <div className="mb-10 flex items-end justify-between">
            <div><p className="mb-3 text-[11px] tracking-[0.3em] text-[var(--brand)]">DAHAB FAVORITES</p><h2 className="text-3xl font-light sm:text-4xl">الأكثر مبيعًا</h2><p className="mt-3 text-sm text-gray-500">اختيارات بتحبها عميلات دهب.</p></div>
            <Link href="/products" className="hidden text-sm sm:block">كل المنتجات ←</Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {products.filter((p)=>p.bestSeller).slice(0,4).map((product)=><Link key={product.slug} href={`/products/${product.slug}`} className="group block"><div className="relative aspect-[3/4] overflow-hidden bg-[var(--surface)]"><ProductCardImages images={product.images?.length?product.images:[product.image]} alt={product.name} imgClassName="h-full w-full object-cover transition duration-700 group-hover:scale-105"/><span className="absolute right-3 top-3 bg-white px-3 py-1.5 text-[10px]">الأكثر مبيعًا</span></div><div className="pt-4"><h3 className="text-sm">{product.name}</h3><p className="mt-2 text-sm font-medium">{product.price.toLocaleString("ar-EG")} ج.م</p></div></Link>)}
          </div>
        </section>
      )}

      {/* ── Brand promise ── */}
      <section className="bg-[var(--ink)] px-5 py-16 text-white">
        <div className="mx-auto grid max-w-5xl gap-8 text-center md:grid-cols-3 md:text-right">
          <div><p className="text-[11px] tracking-[0.25em] text-[var(--brand-soft)]">DAHAB QUALITY</p><h3 className="mt-2 text-xl font-light">تفاصيل تستحق الاختيار</h3><p className="mt-2 text-sm leading-7 text-white/60">تصميمات مختارة بعناية عشان كل قطعة تحسسك بالفرق.</p></div>
          <div><p className="text-[11px] tracking-[0.25em] text-[var(--brand-soft)]">EASY ORDER</p><h3 className="mt-2 text-xl font-light">اطلبيها في دقائق</h3><p className="mt-2 text-sm leading-7 text-white/60">اختاري، أضيفي للسلة، وسيبي علينا الباقي.</p></div>
          <div><p className="text-[11px] tracking-[0.25em] text-[var(--brand-soft)]">MADE FOR YOU</p><h3 className="mt-2 text-xl font-light">أناقتك بطابع دهب</h3><p className="mt-2 text-sm leading-7 text-white/60">عبايات وإكسسوارات تجمع بين البساطة والفخامة.</p></div>
        </div>
      </section>

      {/* ── Accessories ── */}
      <section id="accessories" className="mx-auto max-w-7xl px-5 py-20">

        <div className="mb-12 text-center">
          <p className="mb-3 text-[11px] tracking-[0.3em] text-[var(--brand)]">
            COMPLETE YOUR LOOK
          </p>
          <h2 className="text-3xl font-light sm:text-4xl">
            كمّلي إطلالتك
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {accessoryItems.map(([title, image, href]) => (
            <Link key={title} href={href} className="group relative aspect-square overflow-hidden">
              <img
                src={image}
                alt={title}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/25" />
              <h3 className="absolute bottom-5 right-5 text-xl text-white">{title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Features bar ── */}
      <section className="border-y border-black/5 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4">
          {[
            [Truck, "شحن سريع", "لجميع المحافظات"],
            [RotateCcw, "استبدال سهل", "بكل سهولة"],
            [ShieldCheck, "جودة مختارة", "نختارها بعناية"],
            [ShoppingBag, "دفع عند الاستلام", "آمن وسهل"],
          ].map(([Icon, title, subtitle]) => (
            <div
              key={title as string}
              className="flex flex-col items-center border-l border-black/5 px-3 py-10 text-center"
            >
              <Icon size={25} strokeWidth={1.2} className="mb-4 text-[var(--brand)]" />
              <h3 className="text-sm">{title as string}</h3>
              <p className="mt-1 text-[11px] text-gray-400">{subtitle as string}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="bg-[var(--surface)] px-5 py-20 text-center">
        <p className="mb-3 text-[11px] tracking-[0.3em] text-[var(--brand)]">STAY IN TOUCH</p>
        <h2 className="text-3xl font-light">كوني أول من يعرف جديد دهب</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-gray-500">
          اشتركي معنا ليصلك كل جديد من التشكيلات والعروض.
        </p>
        <div className="mx-auto mt-7 flex max-w-md border-b border-black/30">
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            className="min-w-0 flex-1 bg-transparent px-2 py-4 text-sm outline-none"
          />
          <button className="px-4 text-sm">اشتراك ←</button>
        </div>
      </section>

      <StoreFooter />

    </main>
  );
}
